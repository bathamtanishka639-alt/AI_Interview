// src/config/env.js — real backend APIs enabled
export const config = {
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === 'true', // default: mock off
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api',
  MOCK_LATENCY_MS: 500,
};
