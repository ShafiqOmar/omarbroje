import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login              from './pages/auth/Login';
import Register           from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import ProviderDashboard  from './pages/provider/ProviderDashboard';
import CharityDashboard   from './pages/charity/CharityDashboard';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import AdminDashboard     from './pages/admin/AdminDashboard';
import ForgotPassword from './pages/auth/ForgotPassword';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const routes = { PROVIDER: '/provider', CHARITY: '/charity', VOLUNTEER: '/volunteer', ADMIN: '/admin' };
  return <Navigate to={routes[user.role] || '/login'} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<HomeRedirect />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/provider" element={<ProtectedRoute allowedRoles={['PROVIDER']}><ProviderDashboard /></ProtectedRoute>} />
      <Route path="/charity"  element={<ProtectedRoute allowedRoles={['CHARITY']}><CharityDashboard /></ProtectedRoute>} />
      <Route path="/volunteer"element={<ProtectedRoute allowedRoles={['VOLUNTEER']}><VolunteerDashboard /></ProtectedRoute>} />
      <Route path="/admin"    element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<h2>403 — Access Denied</h2>} />
      <Route path="*"             element={<h2>404 — Not Found</h2>} />
    </Routes>
  );
}