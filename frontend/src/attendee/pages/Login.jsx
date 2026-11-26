import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSchedule } from '../context/ScheduleContext';

const getRoleHome = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'exhibitor') return '/exhibitor';
  return '/events';
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, loading, error, clearError, user } = useAuthStore();
  const { refresh } = useSchedule();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    clearError();
    if (user) navigate(getRoleHome(user.role), { replace: true });
  }, [clearError, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login({ email: email.trim(), password });
    if (!res.ok) return;

    if (res.user?.role === 'attendee') {
      await refresh();
    }

    navigate(location.state?.from || getRoleHome(res.user?.role), { replace: true });
  };

  return (
    <main className="es-page-wrap es-auth-shell">
      <section className="es-auth-card" aria-labelledby="login-heading">
        <span className="es-kicker">Welcome back</span>
        <h1 id="login-heading">Log in to EventSphere</h1>
        <p className="es-auth-sub">
          Access your saved sessions, exhibitor bookings, or organizer tools.
        </p>

        <form className="es-form" onSubmit={handleSubmit}>
          {error && <div className="es-alert es-alert--error">{error}</div>}

          <div className="es-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                if (error) clearError();
                setEmail(e.target.value);
              }}
            />
          </div>

          <div className="es-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                if (error) clearError();
                setPassword(e.target.value);
              }}
            />
          </div>

          <button type="submit" className="es-btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <p className="es-auth-foot">
          New to EventSphere? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}