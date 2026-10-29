const TECH_SKILLS = [
  'javascript', 'react', 'node', 'express', 'python', 'java', 'sql', 'postgresql', 'mongodb', 'aws', 'docker', 'kubernetes', 'typescript', 'nextjs', 'tailwind', 'css', 'html', 'api', 'graphql', 'redux', 'cypress', 'jest', 'testing', 'machine learning', 'ai', 'data analysis', 'excel', 'power bi', 'figma', 'uiux', 'project management', 'agile', 'communication', 'leadership'
];

const JOB_LIBRARY = [
  { title: 'Frontend Developer', keywords: ['react', 'javascript', 'html', 'css', 'uiux', 'tailwind'] },
  { title: 'Full Stack Developer', keywords: ['node', 'express', 'react', 'sql', 'api', 'javascript'] },
  { title: 'Data Analyst', keywords: ['sql', 'excel', 'power bi', 'python', 'data analysis'] },
  { title: 'Product Manager', keywords: ['project management', 'agile', 'communication', 'leadership'] },
  { title: 'Machine Learning Engineer', keywords: ['python', 'machine learning', 'ai', 'sql', 'data analysis'] },
  { title: 'DevOps Engineer', keywords: ['docker', 'kubernetes', 'aws', 'linux', 'ci'] },
  { title: 'UX Designer', keywords: ['figma', 'uiux', 'design', 'communication'] },
];

const COURSE_LIBRARY = [
  'React + TypeScript Bootcamp',
  'Node.js Backend Development',
  'SQL and PostgreSQL Mastery',
  'Python for Data Analysis',
  'AWS Cloud Practitioner',
  'Docker and Kubernetes Fundamentals',
  'Machine Learning Essentials',
  'Product Management Foundations'
];

function normalizeText(text = '') {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractSkills(text) {
  const normalized = normalizeText(text);
  const found = TECH_SKILLS.filter((skill) => normalized.includes(skill));
  return [...new Set(found)];
}

function scoreResume(text) {
  const skillCount = extractSkills(text).length;
  const qualitySignals = ['experience', 'leadership', 'project', 'analysis', 'team', 'managed', 'developed', 'implemented'];
  const signalMatches = qualitySignals.filter((signal) => normalizeText(text).includes(signal)).length;
  const raw = Math.min(100, 35 + skillCount * 7 + signalMatches * 5);
  return Math.max(58, Math.round(raw));
}

function buildSummary(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const preview = words.slice(0, 120).join(' ');
  return preview.length > 260 ? `${preview.slice(0, 260)}...` : preview;
}

function buildJobRecommendations(skills) {
  return JOB_LIBRARY.filter((job) => {
    const matchCount = job.keywords.filter((keyword) => skills.some((skill) => skill.includes(keyword) || keyword.includes(skill))).length;
    return matchCount > 0;
  }).map((job) => job.title);
}

function buildMissingSkills(skills) {
  const preferred = ['javascript', 'react', 'sql', 'python', 'communication', 'project management'];
  return preferred.filter((skill) => !skills.includes(skill));
}

function buildLearningPlan(missingSkills) {
  const plan = missingSkills.length
    ? missingSkills.map((skill) => `${skill}: Complete at least 2 practical exercises and one project-based assessment.`)
    : ['No major gaps detected. Focus on advanced portfolio work and leadership case studies.'];
  return plan;
}

function buildImprovementTips(text) {
  const tips = [];
  const normalized = normalizeText(text);

  if (!normalized.includes('experience')) {
    tips.push('Add a clear professional experience section with quantified results and outcomes.');
  }
  if (!normalized.includes('project')) {
    tips.push('Include 2-3 measurable project examples with technologies, impact, and outcome metrics.');
  }
  if (!normalized.includes('leadership') && !normalized.includes('team')) {
    tips.push('Highlight leadership, collaboration, and cross-functional work to improve seniority signals.');
  }
  if (!normalized.includes('keywords')) {
    tips.push('Add ATS-friendly keywords aligned to your target job title and industry.');
  }

  return tips.length ? tips : ['Your resume already reads strongly. Improve by tightening bullets and adding metrics.'];
}

export function analyzeResume(text) {
  const skills = extractSkills(text);
  const score = scoreResume(text);
  const summary = buildSummary(text);
  const matches = buildJobRecommendations(skills);
  const missingSkills = buildMissingSkills(skills);
  const learningPlan = buildLearningPlan(missingSkills);
  const improvements = buildImprovementTips(text);
  const softSkills = ['Communication', 'Teamwork', 'Problem Solving', 'Adaptability', 'Leadership'];

  return {
    summary,
    skills,
    softSkills,
    experience: skills.length > 4 ? 'Mid to senior professional with hands-on cross-functional experience.' : 'Early-career professional with strong growth potential.',
    qualifications: ['Bachelor\'s degree or equivalent', 'Relevant project work', 'Certifications or coursework'],
    score,
    jobMatches: matches.length ? matches : ['Generalist Developer', 'Analyst'],
    missingSkills,
    learningPlan,
    improvements,
    recommendations: COURSE_LIBRARY.slice(0, Math.max(3, missingSkills.length || 3)),
  };
}
