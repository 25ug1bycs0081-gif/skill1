import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { analyzeResume } from './utils/resumeAnalyzer.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 7000);
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });
const jwtSecret = process.env.JWT_SECRET || 'resume-analyzer-secret';

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5182', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use('/api/auth', rateLimit({ windowMs: 60 * 1000, max: 20 }));

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

async function extractTextFromFile(file) {
  const originalName = file.originalname.toLowerCase();

  if (originalName.endsWith('.pdf')) {
    const data = await pdf(file.buffer);
    return data.text || '';
  }

  if (originalName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || '';
  }

  if (originalName.endsWith('.txt')) {
    return file.buffer.toString('utf8');
  }

  throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT');
}

async function createResumeAnalysis(file, userId) {
  const rawText = await extractTextFromFile(file);
  const analytics = analyzeResume(rawText);

  const resume = await prisma.resume.create({
    data: {
      fileName: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      fileType: file.mimetype || 'application/octet-stream',
      extractedText: rawText,
      summary: analytics.summary,
      skills: analytics.skills.join(', '),
      softSkills: analytics.softSkills.join(', '),
      experience: analytics.experience,
      qualifications: analytics.qualifications.join(', '),
      score: analytics.score,
      jobMatches: analytics.jobMatches.join(', '),
      missingSkills: analytics.missingSkills.join(', '),
      learningPlan: analytics.learningPlan.join(' | '),
      improvements: analytics.improvements.join(' | '),
      userId,
    },
  });

  return {
    ...resume,
    analysis: analytics,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'resume-analyzer-api' });
});

app.post('/api/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Name, valid email, and password are required.' });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '8h' });
  res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });

  return res.status(201).json({ user: sanitizeUser(user), token });
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Valid email and password are required.' });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '8h' });
  res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });

  return res.json({ user: sanitizeUser(user), token });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found.' });
  return res.json({ user: sanitizeUser(user) });
});

app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const resumes = await prisma.resume.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  const latest = resumes[0];

  const stats = {
    totalResumes: resumes.length,
    avgScore: resumes.length ? Math.round(resumes.reduce((sum, item) => sum + item.score, 0) / resumes.length) : 0,
    strongSkills: latest ? latest.skills.split(', ').slice(0, 4) : ['Career growth'],
    opportunities: latest ? latest.jobMatches.split(', ').slice(0, 4) : ['Product roles'],
  };

  return res.json({ stats, resumes });
});

app.post('/api/resumes/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Resume file is required.' });
  }

  try {
    const result = await createResumeAnalysis(req.file, req.user.id);
    return res.status(201).json({ message: 'Resume analyzed successfully.', resume: result });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Resume parsing failed.' });
  }
});

app.get('/api/resumes', authMiddleware, async (req, res) => {
  const resumes = await prisma.resume.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  return res.json({ resumes });
});

app.get('/api/resumes/:id', authMiddleware, async (req, res) => {
  const resume = await prisma.resume.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!resume) {
    return res.status(404).json({ message: 'Resume not found.' });
  }

  return res.json({ resume, analysis: analyzeResume(resume.extractedText) });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Resume Analyzer API listening on http://localhost:${port}`);
});
