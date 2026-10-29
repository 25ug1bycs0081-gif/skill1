import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, CheckCircle2, FileText, GraduationCap, LogOut, Sparkles, Star, Upload, UserCircle2 } from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const API = '/api';

async function apiFetch(url, options = {}) {
  const response = await fetch(`${API}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: 'Aisha Patel', email: 'aisha@example.com', password: 'password123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
      const data = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl grid overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 shadow-2xl lg:grid-cols-[1.3fr_0.9fr]">
        <div className="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_rgba(15,23,42,1))] p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-200">
            <Sparkles className="h-4 w-4" /> ResumeAnalyzer AI
          </div>
          <h1 className="mt-8 text-4xl font-bold leading-tight sm:text-5xl">Turn your resume into career momentum.</h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Analyze skills, discover strengths, compare against target roles, and unlock actionable learning paths with AI-powered recommendations.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['93%', 'ATS fit'],
              ['12+', 'career paths'],
              ['4.8/5', 'user rating'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-slate-300">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 text-slate-900 sm:p-10">
          <div className="mb-6 flex rounded-full bg-slate-100 p-1">
            <button type="button" className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => setMode('login')}>
              Login
            </button>
            <button type="button" className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-slate-900 text-white' : 'text-slate-600'}`} onClick={() => setMode('register')}>
              Register
            </button>
          </div>

          <h2 className="text-3xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-slate-500">Build a stronger and more targeted career profile.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>

            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70">
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function formatList(value) {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function Dashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const loadData = async () => {
    try {
      const [dashboardData, resumeData] = await Promise.all([
        apiFetch('/dashboard'),
        apiFetch('/resumes'),
      ]);
      setDashboard(dashboardData);
      setResumes(resumeData.resumes || []);
      if (resumeData.resumes?.[0]) setSelectedId(resumeData.resumes[0].id);
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedResume = useMemo(() => resumes.find((item) => item.id === selectedId) || resumes[0], [resumes, selectedId]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setStatus('Please select a PDF, DOCX, or TXT file.');
      return;
    }

    setUploading(true);
    setStatus('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await fetch(`${API}/resumes/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');
      setStatus('Resume analyzed successfully.');
      setFile(null);
      event.target.reset();
      await loadData();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setUploading(false);
    }
  };

  const radarData = selectedResume ? [
    { subject: 'Skills', value: Math.min(100, selectedResume.score) },
    { subject: 'ATS', value: Math.min(95, selectedResume.score + 5) },
    { subject: 'Fit', value: Math.min(90, selectedResume.score - 5) },
    { subject: 'Experience', value: Math.min(88, selectedResume.score + 10) },
    { subject: 'Growth', value: Math.min(92, selectedResume.score + 7) },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-blue-600">ResumeAnalyzer AI</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Career dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">{user.name}</div>
            <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total resumes" value={dashboard?.stats.totalResumes ?? 0} accent="bg-blue-100 text-blue-700" icon={FileText} />
          <StatCard label="Average score" value={`${dashboard?.stats.avgScore ?? 0}%`} accent="bg-emerald-100 text-emerald-700" icon={Star} />
          <StatCard label="Best matches" value={dashboard?.stats.opportunities?.length ?? 0} accent="bg-violet-100 text-violet-700" icon={Briefcase} />
          <StatCard label="Top skills" value={dashboard?.stats.strongSkills?.[0] ? 'Live' : 'N/A'} accent="bg-amber-100 text-amber-700" icon={CheckCircle2} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Upload</p>
                <h3 className="text-xl font-bold text-slate-900">Analyze a new resume</h3>
              </div>
              <Upload className="h-5 w-5 text-blue-600" />
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
              <button type="submit" disabled={uploading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70">
                {uploading ? 'Analyzing resume...' : 'Upload & analyze'}
              </button>
            </form>

            {status ? <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{status}</div> : null}
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Resume history</p>
                <h3 className="text-xl font-bold text-slate-900">Recent analyses</h3>
              </div>
            </div>
            <div className="space-y-3">
              {resumes.length ? resumes.map((resume) => (
                <button key={resume.id} onClick={() => setSelectedId(resume.id)} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${selectedResume?.id === resume.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                  <div>
                    <div className="font-semibold text-slate-800">{resume.originalName}</div>
                    <div className="text-xs text-slate-500">{new Date(resume.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{resume.score}%</div>
                </button>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Upload your first resume to begin analysis.</div>
              )}
            </div>
          </div>
        </div>

        {selectedResume ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Profile analysis</p>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedResume.originalName}</h3>
                </div>
                <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">Score {selectedResume.score}%</div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">Summary</p>
                  <p className="mt-2 text-slate-700">{selectedResume.summary}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Top skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formatList(selectedResume.skills).slice(0, 6).map((skill) => (
                      <span key={skill} className="badge bg-slate-100 text-slate-700">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Soft skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formatList(selectedResume.softSkills).map((skill) => (
                      <span key={skill} className="badge bg-blue-100 text-blue-700">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Qualifications</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedResume.qualifications}</p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Skill radar</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="80%">
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#2563eb" fill="#60a5fa" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}

        {selectedResume ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2 text-blue-700"><Briefcase className="h-5 w-5" /> <span className="font-semibold">Job matches</span></div>
              <ul className="space-y-2 text-sm text-slate-700">
                {formatList(selectedResume.jobMatches).map((role) => (
                  <li key={role} className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-blue-600" /> {role}</li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2 text-violet-700"><GraduationCap className="h-5 w-5" /> <span className="font-semibold">Learning plan</span></div>
              <ul className="space-y-2 text-sm text-slate-700">
                {selectedResume.learningPlan.split('|').map((item) => item.trim()).filter(Boolean).map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-violet-600" /> {item}</li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2 text-emerald-700"><UserCircle2 className="h-5 w-5" /> <span className="font-semibold">Resume improvements</span></div>
              <ul className="space-y-2 text-sm text-slate-700">
                {selectedResume.improvements.split('|').map((item) => item.trim()).filter(Boolean).map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const data = await apiFetch('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const onLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">Loading ResumeAnalyzer AI...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Dashboard user={user} onLogout={onLogout} /> : <AuthScreen onAuth={setUser} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
