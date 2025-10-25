import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import RequireAuth from './components/layout/RequireAuth';
import RequireAdmin from './components/layout/RequireAdmin';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import OverviewPage from './pages/dashboard/OverviewPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import RecordsPage from './pages/dashboard/records/RecordsPage';
import EditRecordPage from './pages/dashboard/records/EditRecordPage';
import UsersPage from './pages/admin/UsersPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import AdminStatsPage from './pages/admin/AdminStatsPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />

          <Route path="auth">
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<DashboardLayout />}>
              <Route path="app">
                <Route index element={<OverviewPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="records" element={<RecordsPage />} />
                <Route path="records/:id" element={<EditRecordPage />} />
              </Route>

              <Route element={<RequireAdmin />}>
                <Route path="app/users" element={<UsersPage />} />
                <Route path="app/audit" element={<AuditLogsPage />} />
                <Route path="app/admin/stats" element={<AdminStatsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
