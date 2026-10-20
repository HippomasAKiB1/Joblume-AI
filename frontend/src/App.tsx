import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// Dashboard
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import MyResumesPage from './pages/dashboard/MyResumesPage';
import ResumeBuilderPage from './pages/dashboard/ResumeBuilderPage';
import TemplatesPage from './pages/dashboard/TemplatesPage';
import JobTailorPage from './pages/dashboard/JobTailorPage';
import CoverLetterPage from './pages/dashboard/CoverLetterPage';
import ATSScannerPage from './pages/dashboard/ATSScannerPage';
import ApplicationTrackerPage from './pages/dashboard/ApplicationTrackerPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import SettingsPage from './pages/dashboard/SettingsPage';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner spinner-lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Strong-Guarded Admin Route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div className="flex-center" style={{ height: '100vh' }}><div className="spinner spinner-lg" /></div>;
  if (!isAuthenticated || !user?.is_admin) return <Navigate to="/akib-admin" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Admin Master Ingress */}
      <Route path="/akib-admin" element={<AdminLogin />} />

      {/* Admin Analytics Dashboard */}
      <Route path="/dashboard/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Protected Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="resumes" element={<MyResumesPage />} />
        <Route path="resumes/edit/:id" element={<ResumeBuilderPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="job-tailor" element={<JobTailorPage />} />
        <Route path="cover-letters" element={<CoverLetterPage />} />
        <Route path="ats-scanner" element={<ATSScannerPage />} />
        <Route path="applications" element={<ApplicationTrackerPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                boxShadow: 'var(--shadow-lg)',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
