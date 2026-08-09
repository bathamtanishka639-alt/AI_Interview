import { apiRequest } from '../apiClient';

export const getReport = async (id) => {
  const res = await apiRequest(`/interview/report/${id}`);
  const d = res.data;
  const f = d.feedback || {};

  const overallScore = Math.round(
    ((f.technicalScore || 70) + (f.communicationScore || 70) + (f.problemSolvingScore || 70)) / 3
  );

  return {
    id: d.reportId || id,
    sessionId: d.sessionId,
    candidateName: d.candidateName || 'Candidate',
    interviewMode: d.interviewMode || 'mixed',
    createdAt: d.createdAt,
    overallScore,
    completedCount: d.completedCount || 1,
    scoreCards: [
      { label: 'Technical', score: f.technicalScore || 70, maxScore: 100 },
      { label: 'Communication', score: f.communicationScore || 70, maxScore: 100 },
      { label: 'Problem Solving', score: f.problemSolvingScore || 70, maxScore: 100 },
      { label: 'Confidence', score: f.confidenceScore || 70, maxScore: 100 },
    ],
    strengths: f.strengths || [],
    weaknesses: f.weaknesses || [],
    misconceptions: f.misconceptions || [],
    topicsCovered: f.topicsCovered || [],
    recommendations: f.recommendations || [],
    suggestedRevisions: f.suggestedRevisions || [],
    overallSummary: f.overallSummary || '',
    modeSpecificNote: f.modeSpecificNote || '',
    transcriptSummary: d.transcriptSummary || { totalQuestions: 0, totalExchanges: 0 }
  };
};
