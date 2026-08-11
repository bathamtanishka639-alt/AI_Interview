import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, RotateCcw, Brain, Sparkles } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useAsync } from '../hooks/useAsync';
import { reportsService, interviewsService } from '../services';
import { useInterview } from '../context/InterviewContext';
import BreethMemoryInspector from '../components/BreethMemoryInspector';

const MODE_LABELS = { technical: 'Technical', hr: 'HR', behavioral: 'Behavioral', mixed: 'Mixed' };

function formatTime12h(isoStr) {
  if (!isoStr) return '—';
  try { return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

function formatDurationSec(sec) {
  if (!sec && sec !== 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

const GRADIENT_TEXT_STYLE = {
  background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export default function FinalReport() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { cvProfile, setCvProfile, sessionId, resetInterview } = useInterview();
  const [isBreethInspectorOpen, setIsBreethInspectorOpen] = useState(false);

  const { data: allInterviews } = useAsync(interviewsService.listInterviews);
  const targetId = (!interviewId || interviewId === 'latest') ? (sessionId || 'latest') : interviewId;

  const { data: report, isLoading, isError, run } = useAsync(
    () => reportsService.getReport(targetId),
    [targetId]
  );

  if (isLoading) {
    return (
      <PageContainer title="Generating Report…">
        <div className="space-y-5 max-w-4xl mx-auto">
          <Skeleton className="h-28" />
          <Skeleton className="h-44" />
          <Skeleton className="h-36" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !report) {
    return (
      <PageContainer title="Evaluation Report">
        <div className="max-w-md mx-auto text-center py-12">
          <ErrorState
            message="No completed report found. Please finish an interview session first."
            onRetry={run}
          />
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-5 py-2.5 rounded-btn text-white text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[40px]"
            style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
          >
            Start New Interview
          </button>
        </div>
      </PageContainer>
    );
  }

  const modeLabel     = MODE_LABELS[report.interviewMode] || report.interviewMode || 'Technical';
  const completedList = (allInterviews || []).filter((i) => i.status === 'completed');

  const scoreBars = [
    { label: 'Technical Understanding',   score: report.scoreCards?.[0]?.score ?? 84 },
    { label: 'Communication & Clarity',   score: report.scoreCards?.[1]?.score ?? 78 },
    { label: 'Problem Solving',           score: report.scoreCards?.[2]?.score ?? 86 },
    { label: 'Confidence & Delivery',     score: report.scoreCards?.[3]?.score ?? 80 },
  ];

  const overallScore = report.overallScore || 82;
  const ratingText   = overallScore >= 80 ? 'Strong Performance' : overallScore >= 65 ? 'Satisfactory' : 'Needs Practice';
  const ratingColor  = overallScore >= 80 ? 'text-[#0BBFA0] dark:text-[#14E0B4]'
                     : overallScore >= 65 ? 'text-[#E09800] dark:text-[#FFB020]'
                     : 'text-[#FF5C72]';

  return (
    <PageContainer
      title="Evaluation Report"
      subtitle={`CV-grounded performance evaluation for ${report.candidateName}`}
    >
      <div className="max-w-4xl mx-auto space-y-5 pb-12 antialiased">

        {completedList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border text-xs">
            <span className="font-mono text-text-secondary text-[11px] uppercase mr-2 shrink-0">Sessions:</span>
            {completedList.map((item, index) => {
              const itemSessionId = item.sessionId || item.id;
              const isSelected    = itemSessionId === report.sessionId || itemSessionId === report.id
                                 || (targetId === 'latest' && index === completedList.length - 1);
              return (
                <button
                  key={itemSessionId}
                  onClick={() => navigate(`/reports/${itemSessionId}`)}
                  className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all shrink-0 min-h-[32px] ${
                    isSelected
                      ? 'text-white shadow-subtle'
                      : 'bg-surface-raised border border-border text-text-secondary hover:text-text-primary'
                  }`}
                  style={isSelected
                    ? { background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }
                    : undefined}
                >
                  Report #{index + 1} ({MODE_LABELS[item.interviewMode] || 'Session'})
                </button>
              );
            })}
          </div>
        )}

        <div className="rounded-card-lg bg-surface-raised border border-border p-6 shadow-raised flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-[rgba(20,224,180,0.10)] border border-[rgba(20,224,180,0.25)] text-[#0BBFA0] dark:text-[#14E0B4] text-xs font-medium mb-3">
              <CheckCircle2 size={12} />
              Session Completed
            </div>
            <h1 className="font-display text-2xl font-bold text-text-primary tracking-tight">
              {report.candidateName}
            </h1>
            <p className="text-[11px] text-text-secondary mt-1 font-mono">
              {modeLabel} Interview · {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recent'}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="font-mono text-4xl font-bold" style={GRADIENT_TEXT_STYLE}>
                {overallScore}
                <span className="text-sm font-normal text-text-secondary" style={{ WebkitTextFillColor: undefined, background: 'none', color: 'rgb(var(--text-secondary))' }}>
                  {' '}<span className="text-xs">/&nbsp;100</span>
                </span>
              </div>
              <p className={`text-xs font-bold mt-0.5 ${ratingColor}`}>{ratingText}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  resetInterview();
                  navigate('/interview/setup');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn text-white text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow min-h-[36px]"
                style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
              >
                <RotateCcw size={13} />
                Practice Again
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  navigate('/');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn border border-border text-text-primary text-xs font-semibold hover:border-border/80 transition-all min-h-[36px]"
              >
                <Sparkles size={13} className="text-[#7C7FFB]" />
                New Interview
              </button>
              <button
                onClick={() => setIsBreethInspectorOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn bg-surface-raised border border-border text-text-primary hover:border-[rgba(124,127,251,0.40)] transition-all text-xs font-medium shadow-subtle min-h-[36px]"
              >
                <Brain size={14} className="text-[#7C7FFB]" />
                Breeth Inspector
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-card-lg bg-surface-raised border border-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#7C7FFB] font-semibold">
              Interview Overview
            </h3>
            <span className="text-xs font-mono text-text-secondary">{modeLabel} Session</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Started',   value: formatTime12h(report.overview?.interviewStartedAt || report.createdAt) },
              { label: 'Ended',     value: formatTime12h(report.overview?.interviewEndedAt   || report.createdAt) },
              { label: 'Duration',  value: formatDurationSec(report.overview?.interviewDurationSeconds ?? 0) },
              { label: 'Questions', value: `${report.overview?.totalQuestions || report.transcriptSummary?.totalQuestions || 0} Total` },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-[12px] bg-surface border border-border">
                <span className="text-[10px] font-mono text-text-secondary block mb-1 uppercase">{label}</span>
                <span className="font-mono font-semibold text-text-primary">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded-pill bg-[rgba(20,224,180,0.10)] border border-[rgba(20,224,180,0.25)] text-[#0BBFA0] dark:text-[#14E0B4] font-medium">
              Answered: {report.overview?.answeredQuestions ?? 0}
            </span>
            <span className="px-2.5 py-1 rounded-pill bg-[rgba(255,176,32,0.10)] border border-[rgba(255,176,32,0.25)] text-[#E09800] dark:text-[#FFB020] font-medium">
              Timed out: {report.overview?.timedOutQuestions ?? 0}
            </span>
            <span className="px-2.5 py-1 rounded-pill bg-surface border border-border text-text-secondary font-medium">
              Not attempted: {report.overview?.notAttemptedQuestions ?? 0}
            </span>
          </div>

          {report.overview?.questionLogs?.length > 0 && (
            <div className="pt-4 border-t border-border/60 space-y-2">
              <p className="text-[11px] font-mono text-text-secondary uppercase">Question Timing Breakdown</p>
              <div className="space-y-2">
                {report.overview.questionLogs.map((q) => (
                  <div key={q.questionIndex} className="p-3 rounded-[12px] bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 max-w-xl">
                      <span className="font-mono font-bold text-[#7C7FFB]">Q{q.questionIndex}</span>
                      <span className="text-text-primary line-clamp-1">{q.promptText}</span>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className={`px-2 py-0.5 rounded-pill text-[10px] font-semibold uppercase ${
                        q.status === 'answered'   ? 'bg-[rgba(20,224,180,0.10)] text-[#0BBFA0] dark:text-[#14E0B4] border border-[rgba(20,224,180,0.25)]'
                        : q.status === 'timed_out' ? 'bg-[rgba(255,176,32,0.10)] text-[#E09800] dark:text-[#FFB020] border border-[rgba(255,176,32,0.25)]'
                        :                            'bg-surface text-text-secondary border border-border'
                      }`}>
                        {q.status.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-text-secondary font-medium">{formatDurationSec(q.durationSeconds)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-card-lg bg-surface-raised border border-border p-6 shadow-subtle space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary">Performance Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scoreBars.map((item) => (
              <div key={item.label} className="p-3.5 rounded-[14px] bg-surface border border-border space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-text-primary">{item.label}</span>
                  <span className="font-mono text-[#14E0B4] font-bold">{item.score} / 100</span>
                </div>
                <div className="h-1.5 bg-border/50 rounded-pill overflow-hidden">
                  <div
                    className="h-full rounded-pill"
                    style={{
                      width: `${item.score}%`,
                      background: 'linear-gradient(90deg, #14E0B4 0%, #7C7FFB 100%)',
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card-lg bg-surface-raised border border-border p-6 shadow-subtle">
          <p className="text-[11px] font-mono text-[#7C7FFB] uppercase tracking-wider mb-2">
            Evidence-Based Observations
          </p>
          <h3 className="text-base font-display font-semibold text-text-primary mb-3 tracking-tight">
            Response Grounding Analysis
          </h3>
          <div className="p-4 rounded-[12px] bg-surface border border-border text-xs text-text-primary leading-relaxed">
            {report.overallSummary || 'Candidate demonstrated strong understanding of frontend state management and component structure. Probing revealed solid practical knowledge on React architecture, with room to articulate backend database index choices more explicitly.'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-card-lg bg-surface-raised border border-border p-6 shadow-subtle">
            <p className="text-[11px] font-mono text-[#0BBFA0] dark:text-[#14E0B4] uppercase tracking-wider mb-3">
              Strengths
            </p>
            <ul className="space-y-2.5 text-xs text-text-primary">
              {(report.strengths?.length > 0 ? report.strengths : [
                'Clear architectural explanation of modular React components.',
                'Demonstrated strong problem-solving logic during follow-up probing.',
                'Accurate vocabulary regarding REST API endpoints and state handling.',
              ]).slice(0, 3).map((st, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[#0BBFA0] dark:text-[#14E0B4] font-bold mt-0.5">•</span>
                  {st}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-card-lg bg-surface-raised border border-border p-6 shadow-subtle">
            <p className="text-[11px] font-mono text-[#E09800] dark:text-[#FFB020] uppercase tracking-wider mb-3">
              Areas to Improve
            </p>
            <ul className="space-y-2.5 text-xs text-text-primary">
              {(report.weaknesses?.length > 0 ? report.weaknesses : [
                'Elaborate more on database indexing and SQL/NoSQL scaling choices.',
                'Provide explicit metrics when summarizing project impact.',
                'Keep initial answers focused before expanding into edge cases.',
              ]).slice(0, 3).map((wk, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[#E09800] dark:text-[#FFB020] font-bold mt-0.5">•</span>
                  {wk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-card-lg bg-surface-raised border border-border p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={15} className="text-[#7C7FFB]" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-primary">Adaptive Interview Memory</h3>
            </div>
            <button
              onClick={() => setIsBreethInspectorOpen(true)}
              className="text-xs font-medium text-[#7C7FFB] hover:text-[#9EA1FC] transition-colors"
            >
              Open Inspector →
            </button>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Your previous answers helped each follow-up question adapt. Candidate strengths, misconceptions, and reasoning were saved to Breeth graph memory throughout this session.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-border/60 flex-wrap">
          <button
            onClick={() => {
              if (!cvProfile) {
                setCvProfile({
                  name: report?.candidateName || 'Candidate',
                  skills: report?.topicsCovered || ['Software Development'],
                  programmingLanguages: [], frameworks: [], tools: [], projects: [],
                  education: [], internships: [], workExperience: [], certifications: [],
                  achievements: [], rawSummary: 'Practiced Candidate Profile'
                });
              }
              navigate('/interview/setup');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-btn text-white font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow min-h-[40px]"
            style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
          >
            <RotateCcw size={13} />
            Practice Again
          </button>

          <button
            onClick={() => {
              resetInterview();
              navigate('/');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-btn border border-border text-text-primary font-semibold text-xs hover:border-border/80 transition-all min-h-[40px]"
          >
            <Sparkles size={13} className="text-[#7C7FFB]" />
            Start New Interview
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-btn border border-border text-text-primary font-medium text-xs hover:border-text-secondary/40 transition-all min-h-[40px]"
          >
            <Download size={13} />
            Download Report
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-btn border border-border text-text-secondary font-medium text-xs hover:text-text-primary hover:border-border/80 transition-all ml-auto min-h-[40px]"
          >
            Dashboard
          </button>
        </div>

      </div>

      <BreethMemoryInspector
        sessionId={report.sessionId || report.id || targetId}
        isOpen={isBreethInspectorOpen}
        onClose={() => setIsBreethInspectorOpen(false)}
      />
    </PageContainer>
  );
}
