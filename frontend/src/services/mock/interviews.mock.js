import { config } from '../../config/env';
import { mockInterview } from '../mockData/interview.data';

const delay = (ms = config.MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

const seed = [
  { ...mockInterview, id: 'int-1', status: 'completed', overallScore: 82 },
  { ...mockInterview, id: 'int-2', status: 'completed', overallScore: 74, role: 'Backend Engineer' },
  { ...mockInterview, id: 'int-3', status: 'missed', role: 'Data Engineer', overallScore: null },
  { ...mockInterview, id: 'demo-interview-1', status: 'in_progress' },
];

export const listInterviews = async () => { await delay(); return seed; };

export const getInterview = async (id) => {
  await delay();
  return seed.find((i) => i.id === id) ?? { ...mockInterview, id };
};

export const submitAnswer = async (id, { text }) => {
  await delay(900);
  // simple mock heuristic: short answers get one follow-up
  const followUp = text.trim().split(/\s+/).length < 12;
  return {
    accepted: true,
    answerId: crypto.randomUUID(),
    followUp,
    agentReply: followUp ? 'Can you go a bit deeper — what happens with keyed list items specifically?' : null,
  };
};
