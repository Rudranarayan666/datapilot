import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AppShell } from './components/layout/AppShell';
import { WorkspaceOverviewPage } from './pages/WorkspaceOverviewPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { DatasetDetailPage } from './pages/DatasetDetailPage';
import { AnalyticsExplorerPage } from './pages/AnalyticsExplorerPage';
import { DashboardViewPage } from './pages/DashboardViewPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { AskYourDataPage } from './pages/AskYourDataPage';
import { SettingsPage } from './pages/SettingsPage';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected app routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/workspace" element={<WorkspaceOverviewPage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/datasets/:id" element={<DatasetDetailPage />} />
          <Route path="/analytics" element={<AnalyticsExplorerPage />} />
          <Route path="/dashboards" element={<DashboardsPage />} />
          <Route path="/dashboard/:id" element={<DashboardViewPage />} />
          <Route path="/assistant" element={<AskYourDataPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
