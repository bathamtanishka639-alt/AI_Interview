export const INTERVIEW_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  MISSED: 'missed',
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  INTERVIEW: (id) => `/interview/${id}`,
  REPORT: (id) => `/reports/${id}`,
};
