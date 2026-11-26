import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSchedule } from '../context/ScheduleContext';

const getRoleHome = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'exhibitor') return '/exhibitor';
  return '/events';
};

export default function Register() {
  const [role, setRole] = useState('attendee');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyDescription: '',
    logoUrl: '',
  });
  const [localError, setLocalError] = useState('');

  const { register, loading, error, clearError, user } = useAuthStore();
  const { refresh } = useSchedule();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (user) navigate(getRoleHome(user.role), { replace: true });
  }, [clearError, user, navigate]);

  const setField = (key) => (e) => {
    if (localError) setLocalError('');
    if (error) clearError();
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role,
    };

    if (role === 'exhibitor') {
      payload.companyName = form.companyName.trim();
      payload.companyDescription = form.companyDescription.trim();
      if (form.logoUrl.trim()) payload.logoUrl = form.logoUrl.trim();
    }

    const res = await register(payload);
    if (!res.ok) return;

    if (role === 'attendee') {
      await refresh();
      navigate('/events', { replace: true });
    } else {
      navigate('/exhibitor', { replace: true });
    }
  };

  const activeError = localError || error;

  return (
    <main className="es-page-wrap es-auth-shell">
      <section className="es-auth-card" aria-labelledby="register-heading">
        <span className="es-kicker">Get started</span>
        <h1 id="register-heading">Create your account</h1>
        <p className="es-auth-sub">
          Join expos as an attendee or register your company to showcase a booth.
        </p>

        <div className="es-role-tabs" role="tablist" aria-label="Account role">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'attendee'}
            className={`es-role-tab ${role === 'attendee' ? 'is-active' : ''}`}
            onClick={() => setRole('attendee')}
          >
            Attendee
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'exhibitor'}
            className={`es-role-tab ${role === 'exhibitor' ? 'is-active' : ''}`}
            onClick={() => setRole('exhibitor')}
          >
            Exhibitor
          </button>
        </div>

        <form className="es-form" onSubmit={handleSubmit}>
          {activeError && <div className="es-alert es-alert--error">{activeError}</div>}

          {role === 'exhibitor' && (
            <div className="es-alert es-alert--info">
              Exhibitor profiles are reviewed by an EventSphere admin before appearing in the public directory.
            </div>
          )}

          <div className="es-field">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              type="text"
              required
              placeholder="Alex Morgan"
              value={form.name}
              onChange={setField('name')}
            />
          </div>

          <div className="es-field">
            <label htmlFor="reg-email">Email address</label>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              placeholder="alex@company.com"
              value={form.email}
              onChange={setField('email')}
            />
          </div>

          {role === 'exhibitor' && (
            <>
              <div className="es-field">
                <label htmlFor="reg-company">Company name</label>
                <input
                  id="reg-company"
                  type="text"
                  required
                  placeholder="TechCorp Solutions"
                  value={form.companyName}
                  onChange={setField('companyName')}
                />
              </div>

              <div className="es-field">
                <label htmlFor="reg-desc">Company description</label>
                <textarea
                  id="reg-desc"
                  rows={3}
                  required
                  placeholder="Briefly describe what your company is showcasing..."
                  value={form.companyDescription}
                  onChange={setField('companyDescription')}
                />
              </div>

              <div className="es-field">
                <label htmlFor="reg-logo">Logo URL (optional)</label>
                <input
                  id="reg-logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={form.logoUrl}
                  onChange={setField('logoUrl')}
                />
              </div>
            </>
          )}

          <div className="es-field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={setField('password')}
            />
          </div>

          <div className="es-field">
            <label htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={setField('confirmPassword')}
            />
          </div>

          <button type="submit" className="es-btn-primary" disabled={loading}>
            {loading
              ? 'Creating account...'
              : role === 'exhibitor'
              ? 'Register as Exhibitor'
              : 'Create Attendee Account'}
          </button>
        </form>

        <p className="es-auth-foot">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}