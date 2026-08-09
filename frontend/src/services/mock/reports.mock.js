import { config } from '../../config/env';
import { mockReport } from '../mockData/report.data';

const delay = (ms = config.MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms));
export const getReport = async (id) => { await delay(); return { ...mockReport, interviewId: id }; };
