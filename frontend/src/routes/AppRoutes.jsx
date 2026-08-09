import { Routes, Route } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import LandingPage from '../pages/LandingPage';
import ModeSelection from '../pages/ModeSelection';
import Dashboard from '../pages/Dashboard';
import InterviewScreen from '../pages/InterviewScreen';
import FinalReport from '../pages/FinalReport';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import { InterviewProvider } from '../context/InterviewContext';

/**
 * Route map.
 * - LandingPage, ModeSelection, InterviewScreen: full-bleed (no sidebar/navbar)
 * - Dashboard, FinalReport, Settings: AppShell (sidebar + navbar)
 * All routes wrapped in InterviewProvider for global CV/session state.
 */
export default function AppRoutes() {
  return (
    <InterviewProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/interview/setup" element={<ModeSelection />} />
        <Route path="/interview/:interviewId" element={<InterviewScreen />} />

        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports/latest" element={<FinalReport />} />
          <Route path="/reports/:interviewId" element={<FinalReport />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </InterviewProvider>
  );
}
