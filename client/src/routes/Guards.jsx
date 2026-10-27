import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// ProtectedRoute – redirects to /login if not authenticated
export const ProtectedRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

// RoleRoute – redirects to the user's own dashboard if wrong role
// Usage: <RoleRoute role="vendor"> wraps vendor-only routes
export const RoleRoute = ({ role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    // Send each role to their own home
    const home = user.role === 'vendor' ? '/vendor/dashboard' : '/manager/dashboard';
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
};
