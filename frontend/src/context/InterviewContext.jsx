import { createContext, useContext, useState, useEffect } from 'react';

const InterviewContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

export function InterviewProvider({ children }) {
  // Pure in-memory React state synced with backend server memory
  const [cvProfile, setCvProfile] = useState(null);
  const [interviewMode, setInterviewMode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    try {
      localStorage.removeItem('ai_interview_cv_profile');
      localStorage.removeItem('ai_interview_mode');
      localStorage.removeItem('ai_interview_session_id');
      localStorage.removeItem('ai_interview_report_id');
    } catch {
      // ignore
    }
  }, []);

  const resetInterview = () => {
    setCvProfile(null);
    setInterviewMode(null);
    setSessionId(null);
    setSessionData(null);
    setReportId(null);
  };

  return (
    <InterviewContext.Provider value={{
      cvProfile, setCvProfile,
      interviewMode, setInterviewMode,
      sessionId, setSessionId,
      sessionData, setSessionData,
      reportId, setReportId,
      resetInterview
    }}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
}
