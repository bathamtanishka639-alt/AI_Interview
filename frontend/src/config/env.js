// src/config/env.js — real backend APIs enabled
export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    let url = import.meta.env.VITE_API_BASE_URL.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    return url;
  }
  return '/api';
}

export const config = {
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === 'true', // default: mock off
  get API_BASE_URL() {
    return getApiBaseUrl();
  },
  MOCK_LATENCY_MS: 500,
};

