// api.js - All communication with the FastAPI backend

import axios from 'axios';

// Change this to your deployed backend URL when deploying
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s timeout for long GA runs
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch sample data to populate the form
 */
export const fetchSampleData = async () => {
  const res = await api.get('/api/sample-data');
  return res.data;
};

/**
 * Run full scheduling pipeline (CSP + optimizer)
 * @param {Object} payload - courses, teachers, rooms, timeslots, algorithm settings
 */
export const generateSchedule = async (payload) => {
  const res = await api.post('/api/schedule', payload);
  return res.data;
};

/**
 * Run CSP only (no optimization)
 */
export const runCSPOnly = async (payload) => {
  const res = await api.post('/api/csp-only', payload);
  return res.data;
};

/**
 * Health check
 */
export const healthCheck = async () => {
  const res = await api.get('/api/health');
  return res.data;
};

export default api;