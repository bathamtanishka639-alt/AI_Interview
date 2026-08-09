import { apiRequest } from '../apiClient';

export const getCandidate = async (id) => {
  try {
    const res = await apiRequest('/candidate');
    return res.data;
  } catch (err) {
    console.error('[candidates.api] getCandidate error:', err);
    throw err;
  }
};
