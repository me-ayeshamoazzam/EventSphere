import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      login(data);
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'exhibitor') {
        navigate('/exhibitor');
      } else {
        setError('This portal is for Admin and Exhibitor accounts.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Login failed. Check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role) => {
    setError('');
    setEmail('chsajidali282@gmail.com');
    setPassword(role === 'admin' ? 'eman611$$' : 'eman66');
  };

  return (
    <div className="login-split">
      <div className="login-visual-pane">
        <div className="brand-wordmark" style={{ fontSize: 22 }}>
          Event<span className="brand-accent">Sphere</span>
        </div>

        <div>
          <h1 className="login-hero-title">
            Exhibition Operations &amp; Live Floor Command.
          </h1>
          <p className="login-hero-sub">
            Manage multi-day schedules, review exhibitor applications, track zone occupancy analytics, and reserve floor booths in real time.
          </p>

          <div className="login-preview-blueprint" style={{ marginTop: 28 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#ffffff' }}>
                Hall A · Floor Telemetry Preview
              </span>
              <span className="mono" style={{ fontSize: 12, color: '#f97316' }}>
                4 Zones Active
              </span>
            </div>

            <svg viewBox="0 0 380 120" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <rect x="4" y="6" width="84" height="44" rx="4" fill="#18181b" stroke="#3f3f46" />
              <text x="14" y="26" fill="#ffffff" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">A-101</text>
              <text x="14" y="40" fill="#a1a1aa" fontSize="9.5">Booked</text>

              <rect x="98" y="6" width="84" height="44" rx="4" fill="#fff7ed" stroke="#f97316" strokeWidth="2" />
              <text x="108" y="26" fill="#9a3412" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">A-102</text>
              <text x="108" y="40" fill="#ea580c" fontSize="9.5" fontWeight="600">Selected</text>

              <rect x="192" y="6" width="84" height="44" rx="4" fill="#18181b" stroke="#3f3f46" />
              <text x="202" y="26" fill="#ffffff" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">A-103</text>
              <text x="202" y="40" fill="#a1a1aa" fontSize="9.5">Booked</text>

              <rect x="286" y="6" width="90" height="104" rx="4" fill="#27272a" stroke="#f97316" strokeWidth="1.5" />
              <text x="298" y="30" fill="#ffffff" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">V-201</text>
              <text x="298" y="46" fill="#f97316" fontSize="9.5" fontWeight="600">VIP Island</text>

              <rect x="4" y="66" width="130" height="44" rx="4" fill="#18181b" stroke="#27272a" />
              <text x="14" y="86" fill="#ffffff" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">T-301</text>
              <text x="14" y="100" fill="#a1a1aa" fontSize="9.5">Tech Pavilion</text>

              <rect x="144" y="66" width="132" height="44" rx="4" fill="#18181b" stroke="#27272a" />
              <text x="154" y="86" fill="#ffffff" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">T-302</text>
              <text x="154" y="100" fill="#a1a1aa" fontSize="9.5">Tech Pavilion</text>
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, fontSize: 12.5, color: '#a1a1aa' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={15} color="#f97316" /> Role-Protected Portals
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Layers size={15} color="#f97316" /> Real-Time Konva Floor Map
          </span>
        </div>
      </div>

      <div className="login-form-pane">
        <div className="login-form-box">
          <div>
            <h2 style={{ fontSize: 24 }}>Sign in to Portal</h2>
            <p className="section-subtitle">
              Enter your Admin or Exhibitor credentials to continue.
            </p>
          </div>

          {error && <div className="banner-alert banner-error">{error}</div>}

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="btn btn-orange" disabled={loading}>
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <hr className="divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>
              Quick Portal Fill
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillCredentials('admin')}
              >
                Admin Credentials
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillCredentials('exhibitor')}
              >
                Exhibitor Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
