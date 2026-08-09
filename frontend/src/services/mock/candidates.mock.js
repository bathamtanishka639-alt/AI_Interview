import { config } from '../../config/env';
import { mockCandidate } from '../mockData/candidate.data';

const delay = (ms = config.MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms));
export const getCandidate = async (id) => { await delay(); return { ...mockCandidate, id }; };
