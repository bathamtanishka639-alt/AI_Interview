import { apiRequest } from '../apiClient';

/**
 * List all interview sessions (for dashboard).
 */
export const listInterviews = async () => {
  const res = await apiRequest('/interviews');
  return Array.isArray(res.data) ? res.data : [];
};

/**
 * Start a NEW interview with cvProfile + mode.
 * This is called once, NOT on every page load.
 */
export const startInterview = async (cvProfile, interviewMode, difficulty = 'intermediate') => {
  const res = await apiRequest('/interview/start', {
    method: 'POST',
    body: { cvProfile, interviewMode, difficulty }
  });
  return res.data; // { sessionId, firstMessage, totalQuestions, ... }
};

/**
 * Get existing session by sessionId.
 */
export const getSession = async (sessionId) => {
  const res = await apiRequest(`/interview/session/${sessionId}`);
  return res.data;
};

export const submitAnswer = async (sessionId, message, status = undefined, answerStartedAt = undefined) => {
  const messageText = typeof message === 'string' ? message : (message?.text || message?.message || '');
  const res = await apiRequest('/interview/message', {
    method: 'POST',
    body: { sessionId, message: messageText, status, answerStartedAt }
  });
  return {
    reply: res.data.reply,
    isCompleted: res.data.isCompleted,
    nextDifficulty: res.data.nextDifficulty,
    currentQuestionIndex: res.data.currentQuestionIndex,
    totalQuestions: res.data.totalQuestions,
    status: res.data.status,
    interviewStartedAt: res.data.interviewStartedAt,
    interviewEndedAt: res.data.interviewEndedAt,
    timedQuestions: res.data.timedQuestions
  };
};

// Legacy compat alias
export const getInterview = getSession;
