import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import ExhibitorPortal from './pages/ExhibitorPortal';
import LoginPage from './pages/LoginPage';
import useAuthStore from './store/authStore';
import './App.css';

function HomeRedirect() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'exhibitor') {
    return <Navigate to="/exhibitor" replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['exhibitor']} />}>
          <Route path="/exhibitor" element={<ExhibitorPortal />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
