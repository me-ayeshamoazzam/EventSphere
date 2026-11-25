import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function ProtectedRoute({ allowedRoles }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'admin' ? '/admin' : user.role === 'exhibitor' ? '/exhibitor' : '/login';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
