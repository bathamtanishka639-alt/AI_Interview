import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, ArrowLeft, ArrowRight, LayoutDashboard, Code2, Users, Target, Layers, Check } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { useTheme } from '../hooks/useTheme';

const MODES = [
  {
    id: 'technical',
    label: 'Technical',
    icon: Code2,
    description: 'Test how deeply you understand the technologies, architecture, and projects on your CV.',
    focuses: ['Architecture decisions', 'Code design', 'Algorithms', 'Scalability'],
  },
  {
    id: 'hr',
    label: 'HR',
    icon: Users,
    description: 'Practice questions about your experience, goals, education, and professional journey.',
    focuses: ['Career goals', 'Education background', 'Team collaboration', 'Experience'],
  },
  {
    id: 'behavioral',
    label: 'Behavioral / Situational',
    icon: Target,
    description: 'Work through realistic situations connected to your actual experience and projects.',
    focuses: ['STAR method', 'Conflict resolution', 'Ownership', 'Decision making'],
  },
  {
    id: 'mixed',
    label: 'Mixed',
    icon: Layers,
    description: 'A realistic full-loop interview combining technical depth, HR, and behavioral questions.',
    focuses: ['Technical depth', 'HR profiling', 'Behavioral scenarios', 'Adaptive probing'],
  }
];

export default function ModeSelection() {
  const navigate = useNavigate();
  const { cvProfile, interviewMode, setInterviewMode } = useInterview();
  const { resolved, toggle } = useTheme();
  const [selected, setSelected] = useState(interviewMode || 'technical');

  useEffect(() => {
    if (!cvProfile) {
      navigate('/');
    }
  }, [cvProfile, navigate]);

  if (!cvProfile) return null;

  const handleStart = () => {
    if (!selected) return;
    setInterviewMode(selected);
    navigate('/interview/new');
  };

  return (
    <div className="min-h-screen bg-surface text-text-primary transition-colors duration-200 antialiased">
      <header className="glass border-b border-border/60 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-signal-500 to-agent-500 text-white flex items-center justify-center font-bold text-sm shadow-glow">
              AI
            </div>
            <span className="font-display font-bold text-base tracking-tight text-text-primary">InterviewAI</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-surface-raised border border-border text-text-primary hover:border-agent-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-subtle"
            >
              <LayoutDashboard size={14} className="text-agent-500" />
              <span>Dashboard</span>
            </button>

            <button
              aria-label="Toggle theme"
              onClick={toggle}
              className="rounded-xl p-2 text-text-secondary hover:text-text-primary bg-surface-raised border border-border hover:scale-[1.05] active:scale-[0.95] transition-all shadow-subtle"
            >
              {resolved === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-pill glass border border-border/60 text-xs font-semibold text-text-primary">
              <span className="w-2 h-2 rounded-full bg-signal-500 animate-pulse" />
              <span>{cvProfile.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-14">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-text-primary mb-3">
            How do you want to be interviewed?
          </h1>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            All questions will be grounded in <span className="font-semibold text-text-primary">{cvProfile.name}'s</span> CV.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {MODES.map((mode) => {
            const isSelected = selected === mode.id;
            const IconComponent = mode.icon;
            return (
              <div
                key={mode.id}
                onClick={() => setSelected(mode.id)}
                className={`
                  relative rounded-card-lg border p-6 transition-all duration-150 cursor-pointer text-left
                  hover:-translate-y-0.5
                  ${isSelected
                    ? 'border-agent-500/50 bg-gradient-to-br from-agent-500/8 to-signal-500/5 shadow-glow-agent'
                    : 'border-border/60 glass shadow-raised hover:border-agent-500/30'
                  }
                `}
              >
                <div className={`
                  absolute top-5 right-5 w-5 h-5 rounded-lg flex items-center justify-center transition-all
                  ${isSelected ? 'bg-gradient-to-br from-signal-500 to-agent-500 text-white shadow-glow' : 'border border-border bg-surface'}
                `}>
                  {isSelected && <Check size={11} strokeWidth={3} />}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-gradient-to-br from-signal-500 to-agent-500 text-white shadow-glow' : 'bg-surface border border-border text-text-primary'}`}>
                    <IconComponent size={18} />
                  </div>
                  <h3 className="font-display text-base font-bold text-text-primary">{mode.label}</h3>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mb-4">{mode.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {mode.focuses.map((f) => (
                    <span key={f} className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-surface border border-border/60 text-text-secondary">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleStart}
            disabled={!selected}
            className="w-full max-w-md py-3.5 rounded-2xl bg-gradient-to-br from-signal-500 to-agent-500 text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-glow"
          >
            <span>Continue to Interview</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:scale-[1.01] transition-all"
          >
            <ArrowLeft size={14} />
            <span>Back to CV Upload</span>
          </button>
        </div>
      </main>
    </div>
  );
}
