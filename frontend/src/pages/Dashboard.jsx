import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileCheck, Plus, RotateCcw, CheckCircle2, AlertTriangle, Target } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Skeleton from '../components/ui/Skeleton';
import { useAsync } from '../hooks/useAsync';
import { interviewsService, reportsService } from '../services';
import { useInterview } from '../context/InterviewContext';

const MODE_LABELS = { technical: 'Technical', hr: 'HR', behavioral: 'Behavioral', mixed: 'Mixed' };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatShortPhrase(text, fallback) {
  if (!text) return fallback;
  if (text.length <= 40) return text;
  const firstSentence = text.split('.')[0];
  return firstSentence.length <= 45 ? firstSentence : `${firstSentence.slice(0, 42)}…`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { cvProfile, setCvProfile } = useInterview();
  const { data: rawInterviews, isLoading: isInterviewsLoading } = useAsync(interviewsService.listInterviews);

  const completedInterviews = (rawInterviews || []).filter((i) => i.status === 'completed');
  const latestInterview = completedInterviews[completedInterviews.length - 1];

  const { data: latestReport, isLoading: isReportLoading } = useAsync(
    () => (latestInterview?.sessionId ? reportsService.getReport(latestInterview.sessionId) : Promise.resolve(null)),
    [latestInterview?.sessionId]
  );

  const isLoading = isInterviewsLoading || (Boolean(latestInterview) && isReportLoading);

  const handlePracticeAgain = () => {
    if (!cvProfile && latestReport?.candidateName) {
      setCvProfile({
        name: latestReport.candidateName,
        skills: latestReport.topicsCovered || ['Software Development'],
        programmingLanguages: [], frameworks: [], tools: [], projects: [],
        education: [], internships: [], workExperience: [], certifications: [],
        achievements: [], rawSummary: 'Practiced Candidate Profile'
      });
    }
    navigate('/interview/setup');
  };

  const greeting = getGreeting();
  const candidateFirstName = cvProfile?.name
    ? cvProfile.name.split(' ')[0]
    : (latestReport?.candidateName ? latestReport.candidateName.split(' ')[0] : 'Candidate');

  const overallScore = latestReport?.overallScore || 80;
  const ratingText = overallScore >= 80 ? 'Strong Performance' : overallScore >= 65 ? 'Satisfactory' : 'Needs Practice';
  const ratingColor = overallScore >= 80 ? 'text-[#0BBFA0] dark:text-[#14E0B4]' : overallScore >= 65 ? 'text-[#E09800] dark:text-[#FFB020]' : 'text-[#FF5C72]';

  const strength1 = formatShortPhrase(latestReport?.strengths?.[0], 'Strong technical understanding');
  const strength2 = formatShortPhrase(latestReport?.strengths?.[1], 'Clear project architecture explanation');
  const weakness1 = formatShortPhrase(latestReport?.weaknesses?.[0] || latestReport?.recommendations?.[0], 'Improve system design depth');
  const nextFocusGoal = formatShortPhrase(latestReport?.recommendations?.[0], 'System Architecture Scaling');

  return (
    <PageContainer
      title={`${greeting}, ${candidateFirstName}`}
      subtitle="Practice session history and performance overview"
      actions={
        cvProfile ? (
          <div className="flex items-center gap-2.5">
            {/* Practice Again — secondary */}
            <button
              onClick={handlePracticeAgain}
              className="flex items-center gap-2 px-4 py-2.5 rounded-btn border border-[rgba(124,127,251,0.30)] bg-[rgba(124,127,251,0.08)] text-[#6063E8] dark:text-[#9EA1FC] font-semibold text-xs hover:border-[rgba(124,127,251,0.55)] hover:bg-[rgba(124,127,251,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[40px]"
            >
              <RotateCcw size={14} />
              Practice Again
            </button>
            {/* New Interview — primary gradient */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-btn text-white font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow min-h-[40px]"
              style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
            >
              <Plus size={14} />
              New Interview
            </button>
          </div>
        ) : null
      }
    >
      <div className="space-y-5 max-w-5xl mx-auto">

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : completedInterviews.length === 0 ? (

          /* ─── Empty State ──────────────────────────────────────────────── */
          <div className="bg-mesh rounded-card-lg border border-border p-14 text-center max-w-xl mx-auto my-6">
            {/* Geometric icon — gradient, atmospheric */}
            <div
              className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-5 border border-[rgba(20,224,180,0.22)]"
              style={{ background: 'linear-gradient(135deg, rgba(20,224,180,0.15) 0%, rgba(124,127,251,0.10) 100%)' }}
            >
              <FileCheck size={28} className="text-[#14E0B4]" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-2 tracking-tight">
              No interviews yet
            </h2>
            <p className="text-sm text-text-secondary max-w-sm mx-auto mb-7 leading-relaxed">
              Complete your first interview to unlock performance metrics and progress tracking.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-btn text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow min-h-[44px]"
              style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
            >
              Upload CV & Start First Interview
              <ArrowRight size={15} />
            </button>
          </div>

        ) : (
          <>
            {/* ─── Latest Session Card ─────────────────────────────────────── */}
            {/* Spec: FLAT surface for data-dense content — not glass */}
            {latestInterview && (
              <div className="rounded-card-lg bg-surface-raised border border-border shadow-raised p-6">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
                  <div>
                    <span className="text-[10px] font-mono text-[#7C7FFB] uppercase tracking-wider font-bold">
                      Latest Session
                    </span>
                    <h2 className="font-display text-xl font-bold text-text-primary mt-0.5 tracking-tight">
                      {MODE_LABELS[latestInterview.interviewMode] || 'Technical'} Interview
                    </h2>
                    <p className="text-[11px] text-text-secondary font-mono mt-0.5">
                      {latestInterview.endTime
                        ? new Date(latestInterview.endTime).toLocaleDateString()
                        : 'Recently completed'}
                    </p>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      {/* Spec: numeric score in JetBrains Mono, gradient on number */}
                      <span
                        className="font-mono text-3xl font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {overallScore}
                      </span>
                      <span className="text-xs text-text-secondary font-mono"> / 100</span>
                      <p className={`text-[11px] font-bold mt-0.5 ${ratingColor}`}>{ratingText}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/reports/${latestInterview.sessionId || latestInterview.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-btn border border-border text-text-primary font-semibold text-xs hover:border-[rgba(124,127,251,0.40)] hover:scale-[1.01] transition-all min-h-[36px]"
                    >
                      View Report
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* ─── Insight Grid — flat tinted cells ────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-5 text-xs">
                  {/* Key Strengths */}
                  <div className="p-3.5 rounded-[14px] bg-[rgba(20,224,180,0.06)] border border-[rgba(20,224,180,0.18)]">
                    <p className="flex items-center gap-1 font-mono text-[10px] text-[#0BBFA0] dark:text-[#14E0B4] font-bold uppercase mb-2">
                      <CheckCircle2 size={11} />
                      Key Strengths
                    </p>
                    <ul className="space-y-1.5 text-text-primary font-medium">
                      <li>• {strength1}</li>
                      <li>• {strength2}</li>
                    </ul>
                  </div>

                  {/* Improvement */}
                  <div className="p-3.5 rounded-[14px] bg-[rgba(255,176,32,0.06)] border border-[rgba(255,176,32,0.18)]">
                    <p className="flex items-center gap-1 font-mono text-[10px] text-[#E09800] dark:text-[#FFB020] font-bold uppercase mb-2">
                      <AlertTriangle size={11} />
                      Improve
                    </p>
                    <ul className="space-y-1.5 text-text-primary font-medium">
                      <li>• {weakness1}</li>
                    </ul>
                  </div>

                  {/* Next Focus */}
                  <div className="p-3.5 rounded-[14px] bg-[rgba(124,127,251,0.06)] border border-[rgba(124,127,251,0.18)]">
                    <p className="flex items-center gap-1 font-mono text-[10px] text-[#6063E8] dark:text-[#9EA1FC] font-bold uppercase mb-2">
                      <Target size={11} />
                      Next Focus
                    </p>
                    <p className="text-text-primary font-semibold leading-snug">{nextFocusGoal}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Interview History Table ──────────────────────────────────── */}
            {/* Spec: flat surface — legible, high-contrast data display */}
            <div className="rounded-card-lg bg-surface-raised border border-border shadow-raised p-6">
              <h3 className="font-display text-base font-bold text-text-primary mb-4 tracking-tight">
                Interview History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60">
                      {['Date', 'Type', 'Score', 'Status', ''].map((h) => (
                        <th key={h} className="pb-3 font-mono text-[10px] text-text-secondary uppercase font-bold pr-4 last:text-right">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {completedInterviews.map((interview) => (
                      <tr
                        key={interview.sessionId || interview.id}
                        className="hover:bg-[rgba(124,127,251,0.04)] transition-colors"
                      >
                        <td className="py-3 font-mono text-text-secondary pr-4">
                          {interview.startTime
                            ? new Date(interview.startTime).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-3 font-semibold text-text-primary pr-4">
                          {MODE_LABELS[interview.interviewMode] || 'Technical'}
                        </td>
                        <td className="py-3 font-mono font-bold text-text-primary pr-4">
                          {interview.overallScore || overallScore}
                          <span className="text-text-secondary font-normal"> / 100</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded-pill bg-[rgba(20,224,180,0.10)] border border-[rgba(20,224,180,0.25)] text-[#0BBFA0] dark:text-[#14E0B4] text-[10px] font-bold">
                            Completed
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => navigate(`/reports/${interview.sessionId || interview.id}`)}
                            className="text-xs font-bold text-[#7C7FFB] hover:text-[#6063E8] hover:scale-[1.02] transition-all"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
