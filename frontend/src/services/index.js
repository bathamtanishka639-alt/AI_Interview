// src/services/index.js — composition root; unaffected by backend swap
import { config } from '../config/env';
import * as realInterviews from './real/interviews.api';
import * as mockInterviews from './mock/interviews.mock';
import * as realReports from './real/reports.api';
import * as mockReports from './mock/reports.mock';
import * as realCandidates from './real/candidates.api';
import * as mockCandidates from './mock/candidates.mock';

export const interviewsService = config.USE_MOCK_API ? mockInterviews : realInterviews;
export const reportsService = config.USE_MOCK_API ? mockReports : realReports;
export const candidatesService = config.USE_MOCK_API ? mockCandidates : realCandidates;
