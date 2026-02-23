import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UserCircle, 
  FileText, 
  Code, 
  Briefcase, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Building2, 
  BookOpen, 
  HelpCircle,
  LogOut,
  ChevronRight,
  Award,
  Target,
  Zap,
  Sun,
  Moon,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { User, ReadinessScore, HistoryItem, ModuleType } from './types';
import { geminiService } from './services/geminiService';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
      active 
        ? "bg-primary text-white shadow-xl shadow-primary/20" 
        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-primary")} />
    <span className="font-semibold">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white"
      />
    )}
  </button>
);

const Card = ({ children, className, title, subtitle }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string }) => (
  <div className={cn("bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 card-shadow overflow-hidden", className)}>
    {(title || subtitle) && (
      <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800">
        {title && <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
    )}
    <div className="p-8">{children}</div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color, trend, tip }: { label: string, value: string | number, icon: any, color: string, trend?: string, tip?: string }) => (
  <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
    <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-5 transition-transform group-hover:scale-110", color)} />
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-2xl shadow-lg shadow-current/10", color.replace('bg-', 'bg-opacity-10 text-').replace('500', '600'))}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
            <TrendingUp size={10} /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-display">{value}</h3>
        {tip && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg"><Zap size={10} className="text-amber-500" /> {tip}</p>}
      </div>
    </div>
  </Card>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'landing' | 'auth' | 'app'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setUser(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
      setView('app');
    }
  }, [user]);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [rRes, hRes] = await Promise.all([
        fetch(`/api/readiness/${user.id}`),
        fetch(`/api/history/${user.id}`)
      ]);
      setReadiness(await rRes.json());
      setHistory(await hRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        alert(data.error || "Authentication failed");
      }
    } catch (err) {
      alert("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to initialize Google login');
    }
  };

  if (view === 'landing') {
    return <LandingPage onGetStarted={() => setView('auth')} />;
  }

  if (view === 'auth') {
    return (
      <AuthScreen 
        email={email} 
        setEmail={setEmail} 
        password={password}
        setPassword={setPassword}
        onLogin={handleLogin} 
        onGoogleLogin={handleGoogleLogin}
        loading={loading} 
        onBack={() => setView('landing')} 
        mode={authMode}
        setMode={setAuthMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col sticky top-0 h-screen z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Zap size={20} />
          </div>
          <span className="text-xl font-bold text-primary tracking-tight font-display">Zoro</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeModule === 'dashboard'} onClick={() => setActiveModule('dashboard')} />
          
          <div className="mt-6 mb-4 px-4 py-3 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Level 12</span>
              <span className="text-[10px] font-bold text-slate-400">2,450 XP</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '65%' }} />
            </div>
          </div>

          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preparation</div>
          <SidebarItem icon={MessageSquare} label="AI Interview" active={activeModule === 'interview'} onClick={() => setActiveModule('interview')} />
          <SidebarItem icon={FileText} label="Resume Analyzer" active={activeModule === 'resume'} onClick={() => setActiveModule('resume')} />
          <SidebarItem icon={Code} label="Coding Lab" active={activeModule === 'coding'} onClick={() => setActiveModule('coding')} />
          <SidebarItem icon={Users} label="GD Evaluator" active={activeModule === 'gd'} onClick={() => setActiveModule('gd')} />
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Career</div>
          <SidebarItem icon={Briefcase} label="Career Path" active={activeModule === 'career'} onClick={() => setActiveModule('career')} />
          <SidebarItem icon={Building2} label="Company Prep" active={activeModule === 'company'} onClick={() => setActiveModule('company')} />
          <SidebarItem icon={BookOpen} label="Learning Path" active={activeModule === 'learning'} onClick={() => setActiveModule('learning')} />
          
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Support</div>
          <SidebarItem icon={HelpCircle} label="Doubt Solver" active={activeModule === 'doubt'} onClick={() => setActiveModule('doubt')} />
          <SidebarItem icon={UserCircle} label="My Profile" active={activeModule === 'soft_skills'} onClick={() => setActiveModule('soft_skills')} />
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button 
            onClick={() => { setUser(null); setView('landing'); }}
            className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize font-display">{activeModule.replace('_', ' ')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Readiness Index</span>
                <span className="text-xs font-medium text-primary">{readiness?.overall_score || 0}/100</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-primary font-bold">
                {user?.name[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'dashboard' && (
                <Dashboard readiness={readiness} history={history} user={user!} />
              )}
              {activeModule === 'interview' && <InterviewSimulator user={user!} onComplete={fetchData} />}
              {activeModule === 'resume' && <ResumeAnalyzer user={user!} onComplete={fetchData} />}
              {activeModule === 'coding' && <CodingLab user={user!} onComplete={fetchData} />}
              {activeModule === 'career' && <CareerRecommender user={user!} />}
              {activeModule === 'company' && <CompanyPredictor />}
              {activeModule === 'soft_skills' && <SoftSkillsAnalyzer user={user!} />}
              {activeModule === 'doubt' && <DoubtSolver />}
              {activeModule === 'learning' && <LearningPathGenerator user={user!} />}
              {activeModule === 'gd' && <GDEvaluator user={user!} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-bg-light overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 gradient-bg opacity-5 -z-10" />
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 tracking-wide uppercase">
              The Future of Career Preparation
            </span>
            <h1 className="text-5xl md:text-8xl font-bold text-slate-900 mb-8 font-display tracking-tight leading-[0.9]">
              Your Personal <br />
              <span className="text-gradient">AI Placement Coach</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Master your career journey with realistic AI interview practice, resume optimization, 
              coding evaluation, and personalized placement readiness scoring.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-[24px] font-bold text-lg shadow-2xl shadow-primary/30 hover:scale-105 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
              >
                Get Started Free <ChevronRight size={20} />
              </button>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img key={i} src={`https://picsum.photos/seed/${i}/40/40`} className="w-10 h-10 rounded-full border-2 border-white" alt="User" referrerPolicy="no-referrer" />
                ))}
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">+2k</div>
              </div>
              <p className="text-sm font-medium text-slate-500">Joined by 2,000+ students</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Mock Interviews', value: '50k+' },
              { label: 'Resumes Analyzed', value: '120k+' },
              { label: 'Success Rate', value: '94%' },
              { label: 'Partner Colleges', value: '200+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-slate-900 font-display">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 font-display">Everything you need to <span className="text-primary">get hired</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Our ecosystem covers every aspect of the placement process, powered by state-of-the-art AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={MessageSquare} 
              title="AI Interview Simulator" 
              description="Realistic HR and Technical interview simulations with real-time feedback and scoring."
              color="bg-indigo-500"
            />
            <FeatureCard 
              icon={FileText} 
              title="Resume Analyzer" 
              description="ATS-focused resume analysis with keyword optimization and formatting suggestions."
              color="bg-emerald-500"
            />
            <FeatureCard 
              icon={Code} 
              title="Coding Lab" 
              description="DSA and coding challenges with complexity analysis and optimized solution guides."
              color="bg-rose-500"
            />
            <FeatureCard 
              icon={Users} 
              title="GD Evaluator" 
              description="Simulate group discussions and get evaluated on your communication and leadership."
              color="bg-amber-500"
            />
            <FeatureCard 
              icon={Briefcase} 
              title="Career Path" 
              description="Personalized career roadmaps based on your skills, interests, and goals."
              color="bg-cyan-500"
            />
            <FeatureCard 
              icon={Zap} 
              title="Readiness Index" 
              description="Track your placement readiness with a comprehensive AI-driven score."
              color="bg-violet-500"
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-8 font-display leading-tight">
                How <span className="text-primary">Zoro</span> prepares you for success
              </h2>
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Create your Profile', desc: 'Input your skills, interests, and academic background to personalize your experience.' },
                  { step: '02', title: 'Analyze your Resume', desc: 'Upload your resume to get an ATS score and actionable improvement tips.' },
                  { step: '03', title: 'Practice Interviews', desc: 'Engage in realistic AI-driven mock interviews for both HR and Technical rounds.' },
                  { step: '04', title: 'Track Readiness', desc: 'Monitor your progress with our proprietary AI Readiness Index and get hired.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-4xl font-bold text-primary/20 font-display">{item.step}</span>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 gradient-bg opacity-20 blur-3xl rounded-full" />
              <img 
                src="https://picsum.photos/seed/dashboard/800/600" 
                className="relative rounded-[32px] shadow-2xl border border-white/50" 
                alt="Dashboard Preview" 
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto text-center bg-primary rounded-[48px] p-16 text-white shadow-2xl shadow-primary/40 relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-30 -z-10" />
          <h2 className="text-4xl md:text-5xl font-bold mb-8 font-display leading-tight">Ready to land your <br /> dream job?</h2>
          <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto">Join thousands of students who have accelerated their career with Zoro AI.</p>
          <button 
            onClick={onGetStarted}
            className="px-12 py-5 bg-white text-primary rounded-[24px] font-bold text-xl hover:scale-105 transition-all shadow-xl"
          >
            Start Your Journey
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Zap size={16} />
            </div>
            <span className="text-lg font-bold text-primary font-display">Zoro</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
          </div>
          <p className="text-sm text-slate-400">© 2025 Zoro AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all"
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", color)}>
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-4 font-display">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function AuthScreen({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  onLogin, 
  onGoogleLogin,
  loading, 
  onBack,
  mode,
  setMode
}: { 
  email: string, 
  setEmail: (e: string) => void, 
  password: string,
  setPassword: (p: string) => void,
  onLogin: (e: React.FormEvent) => void, 
  onGoogleLogin: () => void,
  loading: boolean, 
  onBack: () => void,
  mode: 'login' | 'signup',
  setMode: (m: 'login' | 'signup') => void
}) {
  return (
    <div className="min-h-screen bg-bg-light flex">
      {/* Left Side Illustration */}
      <div className="hidden lg:flex flex-1 gradient-bg items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center text-white max-w-lg"
        >
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Zap size={48} />
          </div>
          <h2 className="text-4xl font-bold mb-6 font-display">Unlock Your Potential</h2>
          <p className="text-lg text-white/80 leading-relaxed">
            Join thousands of students who are using Zoro to land their dream jobs at top tech companies.
          </p>
        </motion.div>
      </div>

      {/* Right Side Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <button onClick={onBack} className="text-slate-500 hover:text-primary mb-8 flex items-center gap-2 font-medium transition-all">
            <ChevronRight size={18} className="rotate-180" /> Back to Home
          </button>
          
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500">
              {mode === 'login' ? 'Sign in to continue your preparation journey.' : 'Start your placement preparation today.'}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <button 
              onClick={onGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-slate-700"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>
          </div>

          <form onSubmit={onLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none bg-white"
                placeholder="name@university.edu"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none bg-white"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : (mode === 'login' ? "Sign In" : "Create Account")}
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-100">
            <p className="text-center text-sm text-slate-500">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"} 
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-primary font-bold hover:underline ml-1"
              >
                {mode === 'login' ? 'Sign up for free' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


// --- Module Components ---

function Dashboard({ readiness, history, user }: { readiness: ReadinessScore | null, history: HistoryItem[], user: User }) {
  const badges = [
    { name: 'Fast Learner', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Code Ninja', icon: Code, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Interview Pro', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const radarData = [
    { subject: 'Resume', A: readiness?.resume_score || 0, fullMark: 100 },
    { subject: 'Interview', A: readiness?.interview_score || 0, fullMark: 100 },
    { subject: 'Coding', A: readiness?.coding_score || 0, fullMark: 100 },
    { subject: 'Soft Skills', A: readiness?.soft_skills_score || 0, fullMark: 100 },
    { subject: 'GD', A: 75, fullMark: 100 },
  ];

  const lineData = history.slice(0, 7).reverse().map(h => ({
    name: new Date(h.created_at).toLocaleDateString(),
    score: h.score
  }));

  return (
    <div className="space-y-8">
      {/* Hero Score Section */}
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 dark:bg-black p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full gradient-bg opacity-20 blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display leading-tight">
              Placement Readiness <br />
              <span className="text-cyan-400">Analysis</span>
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-md">
              Your comprehensive score based on technical skills, soft skills, and interview performance.
            </p>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge, i) => (
                <div key={i} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-white/10", badge.bg, badge.color)}>
                  <badge.icon size={16} />
                  {badge.name}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 110}
                  initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 110 * (1 - (readiness?.overall_score || 0) / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-cyan-400"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold font-display tracking-tighter">{readiness?.overall_score || 0}</span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Resume Score" 
          value={`${readiness?.resume_score || 0}%`} 
          icon={FileText} 
          color="bg-indigo-500" 
          trend="+5%"
          tip="Add more action verbs to your experience section."
        />
        <StatCard 
          label="Interview" 
          value={`${readiness?.interview_score || 0}/100`} 
          icon={MessageSquare} 
          color="bg-emerald-500" 
          trend="+12%"
          tip="Focus on STAR method for behavioral questions."
        />
        <StatCard 
          label="Coding" 
          value={`${readiness?.coding_score || 0}/100`} 
          icon={Code} 
          color="bg-rose-500" 
          trend="+8%"
          tip="Practice more Dynamic Programming problems."
        />
        <StatCard 
          label="Soft Skills" 
          value={`${readiness?.soft_skills_score || 0}/100`} 
          icon={Zap} 
          color="bg-amber-500" 
          trend="+2%"
          tip="Try to reduce filler words like 'um' and 'basically'."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <Card className="lg:col-span-2" title="Performance Growth" subtitle="Your progress over the last few sessions">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#1E3A8A" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#1E3A8A', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Suggestions */}
        <Card title="AI Suggestions" subtitle="Personalized recommendations">
          <div className="space-y-4">
            <SuggestionCard 
              icon={Target} 
              title="Target Top Tech" 
              description="Your coding score is high. Try the Amazon-specific prep module."
              color="text-indigo-600 bg-indigo-50"
            />
            <SuggestionCard 
              icon={Award} 
              title="Resume Boost" 
              description="Your resume is missing 'Cloud Computing' keywords. Update now."
              color="text-amber-600 bg-amber-50"
            />
            <SuggestionCard 
              icon={Zap} 
              title="Daily Challenge" 
              description="Solve today's Dynamic Programming problem to earn 50 points."
              color="text-rose-600 bg-rose-50"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function SuggestionCard({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all group cursor-pointer">
      <div className="flex gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function InterviewSimulator({ user, onComplete }: { user: User, onComplete: () => void }) {
  const [step, setStep] = useState<'setup' | 'chat' | 'result'>('setup');
  const [type, setType] = useState<'HR' | 'Technical'>('HR');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const startInterview = async () => {
    setLoading(true);
    const q = await geminiService.generateInterviewQuestion(type, `User Skills: ${user.skills || 'General'}`);
    setQuestion(q || "");
    setStep('chat');
    setLoading(false);
  };

  const submitAnswer = async () => {
    setLoading(true);
    const res = await geminiService.evaluateInterviewAnswer(question, answer);
    setResult(res);
    
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        type: 'interview',
        score: res.score,
        feedback: res.feedback
      })
    });
    
    onComplete();
    setStep('result');
    setLoading(false);
  };

  const radarData = result ? [
    { subject: 'Accuracy', A: result.score, fullMark: 100 },
    { subject: 'Clarity', A: Math.min(100, result.score + 10), fullMark: 100 },
    { subject: 'Structure', A: Math.max(0, result.score - 5), fullMark: 100 },
    { subject: 'Confidence', A: 85, fullMark: 100 },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto">
      {step === 'setup' && (
        <Card className="text-center py-16">
          <div className="w-24 h-24 rounded-[32px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/5">
            <MessageSquare size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3 font-display">AI Interview Simulator</h2>
          <p className="text-slate-500 mb-10 max-w-md mx-auto">Master your interview skills with realistic AI-driven simulations and real-time feedback.</p>
          
          <div className="flex gap-4 justify-center mb-10">
            <button 
              onClick={() => setType('HR')}
              className={cn("px-8 py-4 rounded-2xl border-2 transition-all font-bold", type === 'HR' ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400")}
            >
              HR Interview
            </button>
            <button 
              onClick={() => setType('Technical')}
              className={cn("px-8 py-4 rounded-2xl border-2 transition-all font-bold", type === 'Technical' ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-400")}
            >
              Technical Interview
            </button>
          </div>
          
          <button 
            onClick={startInterview}
            disabled={loading}
            className="bg-primary text-white px-12 py-4 rounded-2xl font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            {loading ? "Initializing AI..." : "Start Session"}
            {!loading && <ChevronRight size={20} />}
          </button>
        </Card>
      )}

      {step === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-primary text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">AI Interviewer</p>
              <p className="text-xl font-medium leading-relaxed font-display">{question}</p>
            </Card>
            
            <div className="aspect-video bg-slate-900 rounded-[32px] overflow-hidden relative group">
              <div className="absolute inset-0 flex items-center justify-center text-white/20">
                <UserCircle size={80} />
              </div>
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Live Preview</span>
              </div>
              <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-bold">
                00:45
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card title="Your Response">
              <textarea 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-64 p-6 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-primary outline-none transition-all bg-slate-50/50"
                placeholder="Speak or type your answer here..."
              />
              <div className="flex items-center justify-between mt-6">
                <button className="p-4 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                  <Zap size={24} />
                </button>
                <div className="flex gap-4">
                  <button onClick={() => setStep('setup')} className="px-6 py-2 text-slate-400 font-bold">Cancel</button>
                  <button 
                    onClick={submitAnswer}
                    disabled={loading || !answer}
                    className="bg-primary text-white px-10 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? "Analyzing..." : "Submit Answer"}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 flex flex-col items-center justify-center py-12">
              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="72" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="#1E3A8A"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={452.39}
                    strokeDashoffset={452.39 - (452.39 * result.score) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-4xl font-bold text-slate-900 font-display">{result.score}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Overall Score</h3>
            </Card>

            <Card className="lg:col-span-2" title="Skill Breakdown">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Radar name="Score" dataKey="A" stroke="#1E3A8A" fill="#1E3A8A" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          
          <Card title="AI Feedback & Suggestions">
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-700 leading-relaxed">{result.feedback}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.suggestions.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <ChevronRight size={14} />
                    </div>
                    <p className="text-sm text-slate-600">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          
          <button 
            onClick={() => setStep('setup')}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-black transition-all"
          >
            Start New Session
          </button>
        </div>
      )}
    </div>
  );
}

function ResumeAnalyzer({ user, onComplete }: { user: User, onComplete: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyze = async () => {
    setLoading(true);
    const res = await geminiService.analyzeResume(text);
    setResult(res);
    
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        type: 'resume',
        score: res.atsScore,
        feedback: res.formattingFeedback
      })
    });
    
    onComplete();
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card title="Resume Content" subtitle="Paste your resume text for deep AI analysis">
        <div className="relative group">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-[450px] p-6 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary transition-all text-sm bg-slate-50/50 font-sans leading-relaxed"
            placeholder="Paste your resume text here..."
          />
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-transparent group-focus-within:border-primary/20 rounded-2xl transition-all" />
        </div>
        <button 
          onClick={analyze}
          disabled={loading || !text}
          className="w-full mt-6 bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Analyzing with AI..." : "Analyze Resume"}
          {!loading && <Zap size={18} />}
        </button>
      </Card>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card title="Analysis Report">
              <div className="flex items-center gap-8 mb-10 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                <div className="relative w-24 h-24 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="44" stroke="#fff" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="#1E3A8A"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={276.46}
                      strokeDashoffset={276.46 - (276.46 * result.atsScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-2xl font-bold text-primary font-display">{result.atsScore}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 font-display">ATS Score</h4>
                  <p className="text-sm text-slate-500 mt-1">Your resume is {result.atsScore > 80 ? 'excellent' : 'needs improvement'}</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Formatting Feedback
                  </h5>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{result.formattingFeedback}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Missing Keywords
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((k: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Improvement Tips
                  </h5>
                  <ul className="space-y-3">
                    {result.improvementTips.map((t: string, i: number) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <Zap size={16} className="text-amber-500 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                Auto-Improve Resume <Zap size={18} className="text-amber-400" />
              </button>
            </Card>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center bg-white/50">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">No Analysis Yet</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">Paste your resume text on the left to get a detailed AI analysis and ATS score.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CodingLab({ user, onComplete }: { user: User, onComplete: () => void }) {
  const [code, setCode] = useState('// Write your solution here\nfunction solve() {\n  \n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const evaluate = async () => {
    setLoading(true);
    const res = await geminiService.evaluateCode('Two Sum: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', code, 'JavaScript');
    setResult(res);
    
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        type: 'coding',
        score: res.score,
        feedback: res.logicFeedback
      })
    });
    
    onComplete();
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        <Card title="Problem Statement" subtitle="Today's Challenge">
          <div className="p-6 bg-slate-900 text-white rounded-3xl border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h4 className="text-xl font-bold mb-4 font-display">Two Sum</h4>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Given an array of integers <code className="bg-white/10 px-1.5 py-0.5 rounded">nums</code> and an integer <code className="bg-white/10 px-1.5 py-0.5 rounded">target</code>, return indices of the two numbers such that they add up to target.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Example 1</p>
                <p className="text-xs font-mono">Input: nums = [2,7,11,15], target = 9</p>
                <p className="text-xs font-mono">Output: [0,1]</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Code Editor">
          <textarea 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[400px] p-6 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm bg-slate-900 text-emerald-400"
          />
          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">JavaScript</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">Auto-save: ON</span>
            </div>
            <button 
              onClick={evaluate}
              disabled={loading}
              className="bg-primary text-white px-10 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50 hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              {loading ? "Running Tests..." : "Run & Submit"}
              {!loading && <Zap size={18} />}
            </button>
          </div>
        </Card>
      </div>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <Card title="Evaluation Results">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Score</p>
                  <p className="text-3xl font-bold text-emerald-700 font-display">{result.score}/100</p>
                </div>
                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-center">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Complexity</p>
                  <p className="text-xl font-bold text-indigo-700 font-display">{result.timeComplexity}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Optimization Tips
                  </h5>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                      {result.logicFeedback}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="AI Code Review">
              <div className="prose prose-sm max-w-none text-slate-600">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Optimized Solution</h5>
                <div className="mt-4 p-4 bg-slate-900 rounded-2xl font-mono text-[10px] text-emerald-400 overflow-x-auto">
                  {result.optimizedCode}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center bg-white/50">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
              <Code size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">No Submission Yet</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">Write your solution and click 'Run & Submit' to get a detailed AI evaluation.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CareerRecommender({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const getRecommendations = async () => {
    setLoading(true);
    const res = await geminiService.recommendCareerPath({
      skills: user.skills,
      interests: user.interests,
      cgpa: user.cgpa
    });
    setRecommendations(res);
    setLoading(false);
  };

  return (
    <div className="space-y-12">
      <Card className="max-w-3xl mx-auto text-center py-16 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
        <div className="w-24 h-24 rounded-[32px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/5">
          <Target size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3 font-display">AI Career Path Recommender</h2>
        <p className="text-slate-500 mb-10 max-w-md mx-auto">Discover high-growth career paths optimized for your skills, interests, and academic profile.</p>
        <button 
          onClick={getRecommendations}
          disabled={loading}
          className="bg-primary text-white px-12 py-4 rounded-2xl font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
        >
          {loading ? "Analyzing Profile..." : "Generate Recommendations"}
          {!loading && <Zap size={20} />}
        </button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {recommendations.map((rec, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full hover:shadow-2xl transition-all group">
              <div className="mb-6">
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-lg tracking-widest">Recommended Path</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-4 font-display group-hover:text-primary transition-colors">{rec.path}</h3>
              </div>
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">{rec.reason}</p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 6-Month Roadmap
                  </h4>
                  <div className="space-y-3">
                    {rec.roadmap.slice(0, 3).map((step: string, j: number) => (
                      <div key={j} className="text-xs text-slate-600 flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center shrink-0 text-[10px] font-bold shadow-sm">{j+1}</div>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-8 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                View Full Roadmap
              </button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CompanyPredictor() {
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  const predict = async () => {
    setLoading(true);
    const res = await geminiService.predictCompanyQuestions(company);
    setPrediction(res);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card title="Company-Specific Predictor" subtitle="Get likely interview questions and strategy for top companies">
        <div className="flex flex-col md:flex-row gap-4">
          <select 
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary transition-all bg-white font-bold text-slate-700"
          >
            <option value="">Select a Target Company</option>
            <option value="TCS">TCS</option>
            <option value="Infosys">Infosys</option>
            <option value="Wipro">Wipro</option>
            <option value="Google">Google</option>
            <option value="Amazon">Amazon</option>
            <option value="Microsoft">Microsoft</option>
            <option value="Meta">Meta</option>
            <option value="Netflix">Netflix</option>
          </select>
          <button 
            onClick={predict}
            disabled={loading || !company}
            className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Predicting..." : "Get Strategy"}
            {!loading && <Zap size={18} />}
          </button>
        </div>
      </Card>

      {prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card title="Technical Questions" className="lg:col-span-1">
            <div className="space-y-3">
              {prediction.technicalQuestions.map((q: string, i: number) => (
                <div key={i} className="text-sm text-slate-600 p-4 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed">{q}</div>
              ))}
            </div>
          </Card>
          <Card title="HR Questions" className="lg:col-span-1">
            <div className="space-y-3">
              {prediction.hrQuestions.map((q: string, i: number) => (
                <div key={i} className="text-sm text-slate-600 p-4 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed">{q}</div>
              ))}
            </div>
          </Card>
          <div className="lg:col-span-1 space-y-8">
            <Card title="Preparation Strategy">
              <p className="text-sm text-slate-700 leading-relaxed bg-primary/5 p-6 rounded-3xl border border-primary/10">{prediction.strategy}</p>
            </Card>
            <Card title="Quick Tips">
              <div className="flex flex-wrap gap-2">
                {prediction.tips.map((tip: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-xl border border-emerald-100">{tip}</span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function SoftSkillsAnalyzer({ user }: { user: User }) {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const analyze = async () => {
    setLoading(true);
    const res = await geminiService.analyzeSoftSkills(transcript);
    setAnalysis(res);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card title="Communication Analysis" subtitle="Paste a transcript of your speech or interview answer">
        <div className="relative group">
          <textarea 
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full h-[350px] p-6 rounded-2xl border border-slate-100 outline-none focus:ring-2 focus:ring-primary transition-all text-sm bg-slate-50/50 leading-relaxed"
            placeholder="e.g. Well, um, I think that, like, my biggest strength is..."
          />
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-transparent group-focus-within:border-primary/20 rounded-2xl transition-all" />
        </div>
        <button 
          onClick={analyze}
          disabled={loading || !transcript}
          className="w-full mt-6 bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Analyzing Communication..." : "Analyze Soft Skills"}
          {!loading && <Zap size={18} />}
        </button>
      </Card>

      <AnimatePresence mode="wait">
        {analysis ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <Card title="Communication Metrics">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Clarity</p>
                  <p className="text-3xl font-bold text-primary font-display">{analysis.clarityScore}%</p>
                </div>
                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Sentiment</p>
                  <p className="text-xl font-bold text-emerald-700 capitalize font-display">{analysis.sentiment}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Filler Words Detected
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.fillerWords.map((w: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100">{w}</span>
                    ))}
                    {analysis.fillerWords.length === 0 && <span className="text-xs text-slate-400 italic">None detected! Great job.</span>}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Improvement Plan
                  </h5>
                  <div className="space-y-3">
                    {analysis.improvementPlan.map((p: string, i: number) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center bg-white/50">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
              <Users size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">No Analysis Yet</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">Paste your speech transcript to get a detailed AI analysis of your communication style.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DoubtSolver() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const solve = async () => {
    setLoading(true);
    const res = await geminiService.solveDoubt(query);
    setResponse(res || "");
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <Card className="text-center py-16 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
        <div className="w-24 h-24 rounded-[32px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/5">
          <HelpCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3 font-display">AI Placement Mentor</h2>
        <p className="text-slate-500 mb-10 max-w-md mx-auto">Ask anything about technical concepts, HR strategies, or placement preparation.</p>
        
        <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-8 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary transition-all bg-white font-medium"
            placeholder="e.g. How to explain polymorphism in an interview?"
          />
          <button 
            onClick={solve}
            disabled={loading || !query}
            className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Thinking..." : "Ask Mentor"}
            {!loading && <Zap size={20} />}
          </button>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {response && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="prose prose-slate max-w-none p-10">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <HelpCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 m-0 font-display">Mentor's Guidance</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">AI Generated Response</p>
                </div>
              </div>
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                {response}
              </div>
              <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400 italic">Was this helpful?</p>
                <div className="flex gap-4">
                  <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all">Yes, thanks!</button>
                  <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all">Need more info</button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LearningPathGenerator({ user }: { user: User }) {
  const [path, setPath] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(false);
    // In a real app, we'd call Gemini here
    setPath([
      { week: 1, topic: 'Data Structures Fundamentals', tasks: ['Arrays & Strings', 'Linked Lists', 'Stack & Queue'] },
      { week: 2, topic: 'Advanced Algorithms', tasks: ['Dynamic Programming', 'Graph Theory', 'Greedy Algorithms'] },
      { week: 3, topic: 'System Design & DB', tasks: ['SQL Optimization', 'Scalability', 'Caching Strategies'] },
      { week: 4, topic: 'Interview Mastery', tasks: ['Mock Technical', 'HR Preparation', 'Behavioral Questions'] },
    ]);
  };

  useEffect(() => {
    generate();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 font-display">Your Personalized Roadmap</h2>
        <p className="text-slate-500 mt-2">A 4-week intensive plan tailored to your profile.</p>
      </div>

      <div className="space-y-6">
        {path?.map((item: any, i: number) => (
          <div key={i} className="relative pl-12 group">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 group-last:bottom-auto group-last:h-8" />
            <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-md" />
            
            <Card className="hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Week {item.week}</span>
                  <h3 className="text-xl font-bold text-slate-900 font-display">{item.topic}</h3>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg">In Progress</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {item.tasks.map((task: string, j: number) => (
                  <div key={j} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md border-2 border-slate-200 flex items-center justify-center shrink-0" />
                    <span className="text-xs text-slate-600 font-medium">{task}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function GDEvaluator({ user }: { user: User }) {
  return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <div className="w-24 h-24 rounded-[32px] bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-8">
        <Users size={48} />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 font-display">AI Group Discussion</h2>
      <p className="text-slate-500 mt-4 max-w-md mx-auto">
        Simulate a multi-participant group discussion. The AI will act as other participants and evaluate your contribution, leadership, and listening skills.
      </p>
      <div className="mt-12 p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl">
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400">
              <UserCircle size={24} />
            </div>
          ))}
          <div className="w-12 h-12 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">YOU</div>
        </div>
        <button className="bg-primary text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          Join Discussion Room
        </button>
      </div>
    </div>
  );
}
