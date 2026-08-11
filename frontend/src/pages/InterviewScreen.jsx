import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, User, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { interviewsService } from '../services';
import { useToast } from '../hooks/useToast';
import SignalPulse from '../components/ui/SignalPulse';

const MODE_LABELS = { technical: 'Technical', hr: 'HR', behavioral: 'Behavioral', mixed: 'Mixed' };
const GLOBAL_DURATION_SEC   = 1800;
const QUESTION_DURATION_SEC = 180;
const START_TYPING_WINDOW_SEC = 30;

function formatTimeMinutes(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatLocalStartTime(isoStringOrMs) {
  try {
    const d = new Date(isoStringOrMs);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return 'Recently'; }
}

export default function InterviewScreen() {
  const navigate = useNavigate();
  const toast    = useToast();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const { cvProfile, setCvProfile, interviewMode, sessionId, setSessionId, setSessionData, setReportId, resetInterview, clearAllData } = useInterview();

  const [stage,              setStage]              = useState('loading');
  const [messages,           setMessages]           = useState([]);
  const [currentIndex,       setCurrentIndex]       = useState(0);
  const [totalQuestions,     setTotalQuestions]     = useState(0);
  const [input,              setInput]              = useState('');
  const [isAgentTyping,      setIsAgentTyping]      = useState(false);
  const [processingState,    setProcessingState]    = useState('Analyzing your response…');

  const [interviewStartedAtMs,   setInterviewStartedAtMs]   = useState(null);
  const [questionStartedAtMs,    setQuestionStartedAtMs]    = useState(null);
  const [answerStartedAtIso,     setAnswerStartedAtIso]     = useState(null);
  const [hasTypedForCurrentQ,    setHasTypedForCurrentQ]    = useState(false);

  const [globalRemainingSec,   setGlobalRemainingSec]   = useState(GLOBAL_DURATION_SEC);
  const [questionRemainingSec, setQuestionRemainingSec] = useState(QUESTION_DURATION_SEC);
  const [questionElapsedSec,   setQuestionElapsedSec]   = useState(0);

  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (!cvProfile || !interviewMode) navigate('/');
  }, [cvProfile, interviewMode, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (stage === 'active') {
        e.preventDefault();
        e.returnValue = 'An interview is currently in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stage]);

  useEffect(() => {
    if (!cvProfile || !interviewMode) return;
    initSession();
  }, []);

  const initSession = async () => {
    setStage('loading');
    isTransitioningRef.current = false;
    try {
      if (sessionId) {
        try {
          const session = await interviewsService.getSession(sessionId);
          if (session) {
            setSessionData(session);
            const questions = session.questions || [];
            setTotalQuestions(questions.length || 5);
            setCurrentIndex(session.currentQuestionIndex || 0);

            const now = Date.now();
            const startMs = session.interviewStartedAt ? new Date(session.interviewStartedAt).getTime() : now;
            setInterviewStartedAtMs(startMs);
            setQuestionStartedAtMs(now);
            setQuestionElapsedSec(0);
            setQuestionRemainingSec(QUESTION_DURATION_SEC);
            setAnswerStartedAtIso(null);
            setHasTypedForCurrentQ(false);

            const rebuilt = [];
            const timedQ = session.timedQuestions || [];
            timedQ.forEach((q, idx) => {
              if (q.promptText) {
                rebuilt.push({ id: `msg-agent-${idx}`, role: 'agent', text: q.promptText });
              }
              if (q.candidateResponse) {
                rebuilt.push({ id: `msg-cand-${idx}`, role: 'candidate', text: q.candidateResponse });
              } else if (q.status === 'not_attempted' || q.status === 'timed_out') {
                rebuilt.push({ id: `msg-sys-${idx}`, role: 'system_notice', text: '[Question Not Attempted / Timed Out]' });
              }
            });

            if (rebuilt.length > 0) {
              setMessages(rebuilt);
            }

            if (session.status === 'completed') {
              setReportId(sessionId);
              setStage('completed');
            } else {
              setStage('active');
            }
            return;
          }
        } catch (err) {
          console.warn('[InterviewScreen] Could not recover session, starting new session:', err);
        }
      }

      const data = await interviewsService.startInterview(cvProfile, interviewMode);
      setSessionId(data.sessionId);
      setSessionData(data);
      setTotalQuestions(data.totalQuestions || 5);
      setCurrentIndex(0);

      const now = Date.now();
      const startMs = data.interviewStartedAt ? new Date(data.interviewStartedAt).getTime() : now;
      setInterviewStartedAtMs(startMs);
      setQuestionStartedAtMs(now);
      setQuestionElapsedSec(0);
      setQuestionRemainingSec(QUESTION_DURATION_SEC);
      setAnswerStartedAtIso(null);
      setHasTypedForCurrentQ(false);

      if (data.firstMessage) {
        setMessages([{ id: `msg-${now}-1`, role: 'agent', text: data.firstMessage }]);
      }
      setStage('active');
    } catch (err) {
      console.error('[InterviewScreen] Failed to start interview:', err);
      setStage('error');
    }
  };

  useEffect(() => {
    if (stage !== 'active' || isAgentTyping || !interviewStartedAtMs || !questionStartedAtMs) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedGlobal = Math.floor((now - interviewStartedAtMs) / 1000);
      setGlobalRemainingSec(Math.max(0, GLOBAL_DURATION_SEC - elapsedGlobal));
      const elapsedQ = Math.floor((now - questionStartedAtMs) / 1000);
      setQuestionElapsedSec(elapsedQ);
      setQuestionRemainingSec(Math.max(0, QUESTION_DURATION_SEC - elapsedQ));
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, isAgentTyping, interviewStartedAtMs, questionStartedAtMs]);

  useEffect(() => {
    if (!isAgentTyping && stage === 'active') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isAgentTyping, stage]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (!hasTypedForCurrentQ && val.trim().length > 0) {
      setHasTypedForCurrentQ(true);
      setAnswerStartedAtIso(new Date().toISOString());
    }
  };

  const executeTurnSubmit = useCallback(async (msgText, statusOverride = undefined) => {
    if (isTransitioningRef.current || !sessionId) return;
    isTransitioningRef.current = true;
    const userText   = msgText.trim();
    const finalStatus = statusOverride || (userText.length > 0 ? 'answered' : 'not_attempted');

    if (userText.length > 0) {
      setMessages((m) => [...m, { id: `msg-${Date.now()}-${Math.random()}`, role: 'candidate', text: userText }]);
    } else if (finalStatus === 'not_attempted') {
      setMessages((m) => [...m, { id: `msg-${Date.now()}-${Math.random()}`, role: 'system_notice', text: '[Question Not Attempted]' }]);
    }

    setInput('');
    setIsAgentTyping(true);
    setProcessingState(finalStatus === 'not_attempted' ? 'Moving to next question…' : 'Evaluating your response…');

    try {
      const result = await interviewsService.submitAnswer(sessionId, userText, finalStatus, answerStartedAtIso);
      const now = Date.now();
      setAnswerStartedAtIso(null);
      setHasTypedForCurrentQ(false);
      setCurrentIndex(result.currentQuestionIndex ?? currentIndex + 1);
      if (result.reply) {
        setMessages((m) => [...m, { id: `msg-${now}-${Math.random()}`, role: 'agent', text: result.reply }]);
      }
      if (result.isCompleted) {
        setReportId(sessionId);
        setStage('completed');
      }
    } catch (err) {
      console.error('[InterviewScreen] Submit turn failed:', err);
      toast.error("Couldn't process your turn. Please check server connection.");
    } finally {
      setIsAgentTyping(false);
      isTransitioningRef.current = false;
      const readyNow = Date.now();
      setQuestionStartedAtMs(readyNow);
      setQuestionElapsedSec(0);
      setQuestionRemainingSec(QUESTION_DURATION_SEC);
    }
  }, [sessionId, answerStartedAtIso, currentIndex, setReportId, toast]);

  useEffect(() => {
    if (stage !== 'active' || isTransitioningRef.current) return;
    if (globalRemainingSec <= 0) {
      const textToSubmit = input.trim();
      toast.info('Your 30-minute interview time limit has concluded.');
      executeTurnSubmit(textToSubmit, textToSubmit.length > 0 ? 'timed_out' : 'not_attempted');
      return;
    }
    if (!hasTypedForCurrentQ && input.trim().length === 0 && questionElapsedSec >= START_TYPING_WINDOW_SEC) {
      toast.info('Time to start this question has expired. Moving to the next question.');
      executeTurnSubmit('', 'not_attempted');
      return;
    }
    if (questionRemainingSec <= 0) {
      const textToSubmit = input.trim();
      toast.info(textToSubmit.length > 0
        ? 'Your time for this question has ended. Moving to the next question.'
        : 'Question time expired. Moving to the next question.');
      executeTurnSubmit(textToSubmit, textToSubmit.length > 0 ? 'timed_out' : 'not_attempted');
    }
  }, [stage, globalRemainingSec, questionElapsedSec, questionRemainingSec, hasTypedForCurrentQ, input, executeTurnSubmit, toast]);

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isAgentTyping || stage !== 'active') return;
    executeTurnSubmit(input.trim(), 'answered');
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center px-4">
        <div className="text-center p-10 rounded-[24px] glass border border-[rgba(15,20,30,0.06)] dark:border-[rgba(255,255,255,0.08)] shadow-raised max-w-sm w-full">
          <div
            className="w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, rgba(124,127,251,0.18) 0%, rgba(20,224,180,0.12) 100%)', border: '1px solid rgba(124,127,251,0.22)' }}
          >
            <SignalPulse size="md" />
          </div>
          <h3 className="font-display text-base font-bold text-text-primary mb-1 tracking-tight">
            Building Your Interview
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Grounding questions in {cvProfile?.name || 'your'} CV profile…
          </p>
        </div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full p-10 rounded-[24px] glass border border-[rgba(15,20,30,0.06)] dark:border-[rgba(255,255,255,0.08)] shadow-raised">
          <div className="w-12 h-12 rounded-[16px] bg-[rgba(255,92,114,0.10)] border border-[rgba(255,92,114,0.25)] text-[#FF5C72] flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-base font-bold text-text-primary mb-1 tracking-tight">
            Could not start interview
          </h3>
          <p className="text-xs text-text-secondary mb-6 leading-relaxed">
            There was a problem connecting to the interview server. Please verify your backend is running.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={initSession}
              className="px-5 py-2.5 rounded-btn text-white text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[40px]"
              style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-btn border border-border text-text-secondary text-xs font-medium hover:text-text-primary hover:border-border/80 transition-all min-h-[40px]"
            >
              Back to Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'completed') {
    const totalDurationSec = interviewStartedAtMs ? Math.round((Date.now() - interviewStartedAtMs) / 1000) : 1800;
    const durMin = Math.floor(totalDurationSec / 60);
    const durSec = totalDurationSec % 60;

    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full p-10 rounded-[28px] glass border border-[rgba(15,20,30,0.06)] dark:border-[rgba(255,255,255,0.08)] shadow-raised">
          <div
            className="w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(20,224,180,0.18) 0%, rgba(124,127,251,0.14) 100%)',
              border: '2px solid rgba(20,224,180,0.30)',
            }}
          >
            <CheckCircle2 size={36} className="text-[#14E0B4]" strokeWidth={1.5} />
          </div>

          <h1 className="font-display text-2xl font-bold text-text-primary mb-1 tracking-tight">
            Interview Completed
          </h1>
          <p className="text-xs text-text-secondary mb-0.5">
            Well done, <span className="font-semibold text-text-primary">{cvProfile?.name}</span>.
          </p>
          <p className="text-xs text-text-secondary mb-6 font-mono">
            {MODE_LABELS[interviewMode]} · {durMin}m {durSec}s
          </p>

          <div className="rounded-[14px] bg-surface-raised border border-border text-xs text-text-secondary mb-6 p-4 text-left leading-relaxed">
            Your timed responses have been evaluated into a complete evidence-based report. Ready to review.
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => navigate(`/reports/${sessionId}`)}
              className="flex items-center justify-center gap-2 py-3 px-7 rounded-btn text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow min-h-[44px]"
              style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
            >
              View Evaluation Report
              <ArrowRight size={14} />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!cvProfile) {
                    setCvProfile({
                      name: cvProfile?.name || 'Candidate',
                      skills: ['Software Development'],
                      programmingLanguages: [], frameworks: [], tools: [], projects: [],
                      education: [], internships: [], workExperience: [], certifications: [],
                      achievements: [], rawSummary: 'Practiced Candidate Profile'
                    });
                  }
                  navigate('/interview/setup');
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-btn border border-[rgba(124,127,251,0.30)] bg-[rgba(124,127,251,0.08)] text-[#6063E8] dark:text-[#9EA1FC] text-xs font-semibold hover:border-[rgba(124,127,251,0.55)] transition-all min-h-[40px]"
              >
                <Sparkles size={13} />
                Practice Again
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  navigate('/');
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-btn border border-border text-text-primary text-xs font-semibold hover:border-border/80 transition-all min-h-[40px]"
              >
                Start New
              </button>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="py-2.5 px-7 rounded-btn border border-border text-text-secondary text-xs font-medium hover:text-text-primary hover:border-border/80 transition-all min-h-[40px]"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isGlobalWarning = globalRemainingSec <= 60;
  const isGlobalUrgent  = globalRemainingSec <= 10;
  const isQWarning      = questionRemainingSec <= 30;
  const isQUrgent       = questionRemainingSec <= 10;

  const globalTimerColor = isGlobalUrgent  ? 'text-[#FF5C72]'
                         : isGlobalWarning ? 'text-[#E09800] dark:text-[#FFB020]'
                         : 'text-text-primary';
  const globalClockColor = isGlobalUrgent  ? 'text-[#FF5C72] animate-pulse'
                         : isGlobalWarning ? 'text-[#E09800] dark:text-[#FFB020]'
                         : 'text-[#7C7FFB]';
  const qTimerColor      = isQUrgent  ? 'text-[#FF5C72]'
                         : isQWarning ? 'text-[#E09800] dark:text-[#FFB020]'
                         : 'text-text-secondary';

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased">

      <header className="glass border-b border-[rgba(15,20,30,0.06)] dark:border-[rgba(255,255,255,0.08)] sticky top-0 z-30 py-2 px-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">

          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-subtle flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C7FFB 0%, #14E0B4 100%)' }}
            >
              {cvProfile?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text-primary leading-none mb-0.5 truncate max-w-[120px] sm:max-w-xs">
                {cvProfile?.name || 'Candidate'}
              </p>
              <p className="text-[10px] font-mono text-text-secondary truncate">
                {MODE_LABELS[interviewMode]}
              </p>
            </div>
          </div>

          {/* Timers */}
          <div className="flex items-center gap-2 text-xs flex-shrink-0">
            {/* Global timer */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-btn bg-surface border border-border min-h-[30px]">
              <Clock size={12} className={globalClockColor} />
              <span className="text-[10px] font-mono text-text-secondary hidden sm:inline">Interview:</span>
              <span className={`font-mono font-bold text-[11px] sm:text-[12px] ${globalTimerColor}`}>
                {formatTimeMinutes(globalRemainingSec)}
              </span>
            </div>

            {/* Per-question timer */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-btn bg-surface border border-border min-h-[30px]">
              <span className="text-[10px] font-mono text-text-secondary">Q:</span>
              <span className={`font-mono font-semibold text-[11px] sm:text-xs ${qTimerColor}`}>
                {formatTimeMinutes(questionRemainingSec)}
              </span>
            </div>

            {/* Question counter */}
            <span className="hidden md:block font-mono font-medium text-text-secondary text-[11px]">
              Q{currentIndex + 1}
              {totalQuestions > 0 ? ` / ${totalQuestions}` : ''}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Chat ─────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-5xl w-full mx-auto flex flex-col p-4 sm:p-6 overflow-hidden">

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === 'candidate'     ? 'justify-end'
                : msg.role === 'system_notice' ? 'justify-center'
                : 'justify-start'
              }`}
            >
              {/* Agent avatar */}
              {msg.role === 'agent' && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border border-[rgba(124,127,251,0.22)]"
                  style={{ background: 'linear-gradient(135deg, rgba(124,127,251,0.15) 0%, rgba(20,224,180,0.08) 100%)' }}
                >
                  <Bot size={14} className="text-[#7C7FFB]" />
                </div>
              )}

              {/* System notice — pill */}
              {msg.role === 'system_notice' ? (
                <div className="px-3 py-1.5 rounded-pill bg-surface-raised border border-border text-[11px] font-mono text-text-secondary">
                  {msg.text}
                </div>
              ) : (
                <div
                  className={`p-4 max-w-2xl leading-relaxed ${
                    msg.role === 'candidate'
                      // Spec: candidate = gradient bg, text-white, round top-right corner square
                      ? 'text-white rounded-[20px] rounded-tr-[4px] shadow-subtle'
                      // Spec: agent = flat surface, solid border, round top-left corner square
                      : 'bg-surface-raised border border-border text-text-primary rounded-[20px] rounded-tl-[4px] shadow-subtle'
                  }`}
                  style={msg.role === 'candidate'
                    ? { background: 'linear-gradient(135deg, rgba(20,224,180,0.92) 0%, rgba(124,127,251,0.95) 100%)' }
                    : undefined}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              )}

              {/* Candidate avatar */}
              {msg.role === 'candidate' && (
                <div className="w-7 h-7 rounded-xl bg-surface-raised border border-border text-text-primary flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                  <User size={13} />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator — Spec: SignalPulse, NOT animate-spin Sparkles */}
          {isAgentTyping && (
            <div className="flex gap-3 text-xs">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border border-[rgba(124,127,251,0.22)]"
                style={{ background: 'linear-gradient(135deg, rgba(124,127,251,0.15) 0%, rgba(20,224,180,0.08) 100%)' }}
              >
                <Bot size={14} className="text-[#7C7FFB]" />
              </div>
              <div className="flex items-center gap-2.5 p-3.5 rounded-[20px] rounded-tl-[4px] bg-surface-raised border border-border shadow-subtle">
                <SignalPulse size="sm" />
                <span className="font-mono text-[11px] text-text-secondary">{processingState}</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-2">
          <div className="flex items-center justify-between px-1 text-[11px] font-mono">
            {!hasTypedForCurrentQ ? (
              <span className="text-[#E09800] dark:text-[#FFB020] flex items-center gap-1">
                <AlertTriangle size={11} />
                Start typing within {Math.max(0, START_TYPING_WINDOW_SEC - questionElapsedSec)}s to open full 3-min window
              </span>
            ) : (
              <span className="text-[#0BBFA0] dark:text-[#14E0B4] font-medium flex items-center gap-1">
                <CheckCircle2 size={11} />
                Full 3-min window active — {formatTimeMinutes(questionRemainingSec)} remaining
              </span>
            )}
            <span className="hidden sm:inline text-text-secondary">Enter to submit</span>
          </div>

          <div className="relative rounded-[20px] glass border border-border/60 focus-within:border-[rgba(20,224,180,0.55)] transition-all shadow-raised p-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleManualSubmit(); }
              }}
              placeholder="Type your answer here…"
              rows={3}
              disabled={isAgentTyping || stage !== 'active'}
              className="w-full bg-transparent resize-none border-none outline-none text-xs text-text-primary placeholder:text-text-secondary/50 p-1"
            />
            <div className="flex items-center justify-between pt-2.5 border-t border-border/50">
              <span className="text-[10px] font-mono text-text-secondary pl-1">
                {input.trim().length} chars
              </span>
              <button
                type="submit"
                disabled={!input.trim() || isAgentTyping || stage !== 'active'}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-btn text-white text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 transition-all min-h-[32px]"
                style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
              >
                Submit Answer
                <Send size={12} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
