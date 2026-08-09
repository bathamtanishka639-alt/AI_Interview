import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Moon, Sun, Brain, Home } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import BreethMemoryInspector from '../BreethMemoryInspector';
import { useInterview } from '../../context/InterviewContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { resolved, toggle } = useTheme();
  const { cvProfile, sessionId } = useInterview();
  const [isBreethOpen, setIsBreethOpen] = useState(false);

  return (
    <>
      {/* Spec: glass header — translucent, backdrop-blur, hairline border */}
      <header className="sticky top-0 z-30 glass border-b border-[rgba(15,20,30,0.06)] dark:border-[rgba(255,255,255,0.08)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">

          {/* Brand — gradient logo mark + Space Grotesk wordmark */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              aria-label="InterviewAI home"
            >
              {/* Gradient logo mark — spec: gradient only on small signature elements */}
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shadow-glow"
                style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
              >
                <span className="text-white font-bold text-xs tracking-tight select-none">AI</span>
              </div>
              <span className="font-display font-bold text-base tracking-tight text-text-primary group-hover:text-[#7C7FFB] transition-colors">
                InterviewAI
              </span>
            </Link>

            {/* CV status pill */}
            {cvProfile ? (
              <span className="hidden sm:flex items-center gap-1.5 rounded-pill bg-[rgba(20,224,180,0.10)] border border-[rgba(20,224,180,0.28)] px-2.5 py-0.5 text-[11px] font-mono text-[#0BBFA0] dark:text-[#14E0B4] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14E0B4] animate-pulse" />
                CV Grounded
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 rounded-pill bg-surface-raised border border-border px-2.5 py-0.5 text-[11px] font-mono text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/40" />
                Adaptive AI
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Home */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 rounded-btn bg-[rgba(124,127,251,0.10)] border border-[rgba(124,127,251,0.25)] px-3 py-1.5 text-xs font-semibold text-[#6063E8] dark:text-[#9EA1FC] hover:bg-[rgba(124,127,251,0.20)] hover:border-[rgba(124,127,251,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[36px]"
              title="Go to landing page"
            >
              <Home size={14} />
              <span>Home</span>
            </button>

            {/* Breeth Inspector */}
            <button
              onClick={() => setIsBreethOpen(true)}
              className="flex items-center gap-1.5 rounded-btn bg-surface-raised border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:border-[rgba(124,127,251,0.40)] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-subtle min-h-[36px]"
              title="Open Breeth Memory Inspector"
            >
              <Brain size={14} className="text-[#7C7FFB]" />
              <span className="hidden sm:inline">Breeth</span>
            </button>

            {/* Theme toggle */}
            <button
              aria-label="Toggle color theme"
              onClick={toggle}
              className="rounded-btn p-2 text-text-secondary hover:text-text-primary bg-surface-raised border border-border hover:scale-[1.05] active:scale-[0.95] transition-all shadow-subtle min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              {resolved === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      <BreethMemoryInspector
        isOpen={isBreethOpen}
        onClose={() => setIsBreethOpen(false)}
        sessionId={sessionId || 'session-latest'}
      />
    </>
  );
}
