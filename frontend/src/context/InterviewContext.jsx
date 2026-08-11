import { createContext, useContext, useState, useEffect } from 'react';

const InterviewContext = createContext(null);

export function InterviewProvider({ children }) {
  const [cvProfile, setCvProfile] = useState(() => {
    try {
      const saved = sessionStorage.getItem('ai_active_cv_profile');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [interviewMode, setInterviewMode] = useState(() => {
    try { return sessionStorage.getItem('ai_active_interview_mode') || null; }
    catch { return null; }
  });
  const [sessionId, setSessionId] = useState(() => {
    try { return sessionStorage.getItem('ai_active_session_id') || null; }
    catch { return null; }
  });
  const [sessionData, setSessionData] = useState(null);
  const [reportId, setReportId] = useState(() => {
    try { return sessionStorage.getItem('ai_active_report_id') || null; }
    catch { return null; }
  });

  useEffect(() => {
    try {
      if (cvProfile) sessionStorage.setItem('ai_active_cv_profile', JSON.stringify(cvProfile));
      else sessionStorage.removeItem('ai_active_cv_profile');
    } catch {}
  }, [cvProfile]);

  useEffect(() => {
    try {
      if (interviewMode) sessionStorage.setItem('ai_active_interview_mode', interviewMode);
      else sessionStorage.removeItem('ai_active_interview_mode');
    } catch {}
  }, [interviewMode]);

  useEffect(() => {
    try {
      if (sessionId) sessionStorage.setItem('ai_active_session_id', sessionId);
      else sessionStorage.removeItem('ai_active_session_id');
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    try {
      if (reportId) sessionStorage.setItem('ai_active_report_id', reportId);
      else sessionStorage.removeItem('ai_active_report_id');
    } catch {}
  }, [reportId]);

  const resetInterview = () => {
    try {
      sessionStorage.removeItem('ai_active_session_id');
      sessionStorage.removeItem('ai_active_report_id');
    } catch {}
    setSessionId(null);
    setSessionData(null);
    setReportId(null);
  };

  const clearAllData = () => {
    try {
      sessionStorage.removeItem('ai_active_cv_profile');
      sessionStorage.removeItem('ai_active_interview_mode');
      sessionStorage.removeItem('ai_active_session_id');
      sessionStorage.removeItem('ai_active_report_id');
    } catch {}
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
      resetInterview,
      clearAllData
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
