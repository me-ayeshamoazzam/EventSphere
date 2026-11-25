import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  LogOut,
  MapPin,
  Upload,
  X,
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import FloorPlanMap from '../components/FloorPlanMap';
import {
  BoothAllocationDonut,
  SessionTimelineGraph,
  ZonePriceSparkChart,
} from '../components/AnalyticsCharts';

const isBoothAvailable = (status) => {
  const normalized = (status || '').toLowerCase();
  return normalized === 'available' || normalized === '';
};

function ExhibitorPortal() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState('floorplan');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [booking, setBooking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    const initPortal = async () => {
      const [eventsRes, profileRes] = await Promise.allSettled([
        api.get('/api/events'),
        api.get('/api/users/profile'),
      ]);
      if (!active) return;

      if (eventsRes.status === 'fulfilled') {
        const list = Array.isArray(eventsRes.value.data) ? eventsRes.value.data : [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0]._id);
        }
      }
      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        const p = profileRes.value.data;
        setCompanyName(p.companyName || '');
        setCompanyDescription(p.companyDescription || '');
        setLogoUrl(p.logoUrl || '');
      }
    };
    initPortal();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    let active = true;
    const fetchBooths = async () => {
      try {
        const { data } = await api.get(`/api/booths/${selectedEventId}`);
        if (!active) return;
        setBooths(Array.isArray(data) ? data : []);
        setSelectedBooth(null);
      } catch {
        if (active) setErrorMessage('Failed to load booths for this event.');
      }
    };
    fetchBooths();
    return () => {
      active = false;
    };
  }, [selectedEventId]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketUrl);

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('boothUpdated', (updatedBooth) => {
      setBooths((prev) =>
        prev.map((b) => (b._id === updatedBooth._id ? { ...b, ...updatedBooth } : b))
      );
      setSelectedBooth((prev) =>
        prev && prev._id === updatedBooth._id ? { ...prev, ...updatedBooth } : prev
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const activeEvent = useMemo(
    () => events.find((ev) => ev._id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  );

  const floorStats = useMemo(() => {
    const open = booths.filter((b) => isBoothAvailable(b.status));
    const booked = booths.filter((b) => !isBoothAvailable(b.status));
    const prices = open.map((b) => Number(b.price)).filter((n) => !Number.isNaN(n) && n > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const myReservations = booths.filter(
      (b) =>
        b.exhibitor?._id === user?._id ||
        b.exhibitorId === user?._id ||
        (companyName && b.exhibitor?.companyName === companyName)
    );
    return {
      total: booths.length,
      openCount: open.length,
      bookedCount: booked.length,
      minPrice,
      myReservations,
    };
  }, [booths, user, companyName]);

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    setProfileSaving(true);
    try {
      await api.put('/api/users/profile', {
        companyName,
        companyDescription,
        logoUrl,
      });
      setStatusMessage('Company profile saved and synced to directory.');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Failed to update profile.'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleBookBooth = async () => {
    if (!selectedBooth) return;
    setStatusMessage('');
    setErrorMessage('');
    setBooking(true);
    try {
      const { data } = await api.put(`/api/booths/${selectedBooth._id}/book`);
      setBooths((prev) => prev.map((b) => (b._id === data._id ? data : b)));
      setSelectedBooth(data);
      setStatusMessage(`Booth ${data.boothNumber} reserved for your company.`);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Failed to book booth.'
      );
    } finally {
      setBooking(false);
    }
  };

  const tabTitles = {
    floorplan: 'Live Floor Plan & Booking',
    profile: 'Company Profile & Branding',
    schedule: 'Reservations & Schedule',
  };

  return (
    <div className="workspace-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-lockup">
            <span className="brand-wordmark">
              Event<span className="brand-accent">Sphere</span>
            </span>
          </div>

          <div>
            <div className="sidebar-section-label">Exhibitor Portal</div>
            <nav className="sidebar-nav" aria-label="Exhibitor navigation">
              <button
                type="button"
                className={`nav-item ${activeTab === 'floorplan' ? 'active' : ''}`}
                onClick={() => setActiveTab('floorplan')}
              >
                <span className="nav-item-left">
                  <MapPin size={16} className="nav-icon" />
                  <span>Live Floor Plan</span>
                </span>
                <span className="nav-count">{floorStats.openCount}</span>
              </button>

              <button
                type="button"
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <span className="nav-item-left">
                  <Building2 size={16} className="nav-icon" />
                  <span>Company Profile</span>
                </span>
              </button>

              <button
                type="button"
                className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                <span className="nav-item-left">
                  <CalendarClock size={16} className="nav-icon" />
                  <span>Bookings &amp; Schedule</span>
                </span>
                {floorStats.myReservations.length > 0 && (
                  <span className="nav-count">{floorStats.myReservations.length}</span>
                )}
              </button>
            </nav>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-account-box">
            <div className="user-account-name">{companyName || user?.name || 'Exhibitor'}</div>
            <div className="user-account-meta">{user?.email} · Exhibitor</div>
          </div>
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={logout}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar-header">
          <div className="breadcrumb-trail">
            <span>EventSphere</span>
            <span aria-hidden="true">/</span>
            <span>Exhibitor Portal</span>
            <span aria-hidden="true">/</span>
            <span className="breadcrumb-current">{tabTitles[activeTab]}</span>
          </div>

          <div className="topbar-actions">
            <select
              aria-label="Select exhibition event"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                border: '1px solid #d4d4d8',
                fontSize: 13,
                background: '#ffffff',
                maxWidth: 240,
              }}
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-orange btn-sm"
              onClick={() => setActiveTab('profile')}
            >
              Edit Profile
            </button>
          </div>
        </header>

        <main className="workspace-content">
          {statusMessage && (
            <div className="banner-alert banner-success">
              <span>{statusMessage}</span>
              <button
                type="button"
                className="btn btn-sm"
                style={{ padding: 2, background: 'transparent' }}
                onClick={() => setStatusMessage('')}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {errorMessage && (
            <div className="banner-alert banner-error">
              <span>{errorMessage}</span>
              <button
                type="button"
                className="btn btn-sm"
                style={{ padding: 2, background: 'transparent' }}
                onClick={() => setErrorMessage('')}
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {activeTab === 'floorplan' && (
            <>
              <div className="section-header">
                <div>
                  <h1 className="section-title">Live Booth Selection Floor Plan</h1>
                  <p className="section-subtitle">
                    {activeEvent?.title || 'Select an event'} · Click any open white booth to inspect and reserve in real time.
                  </p>
                </div>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card kpi-highlight">
                  <span className="kpi-label">Available Booths</span>
                  <span className="kpi-value">{floorStats.openCount}</span>
                  <span className="kpi-meta">Ready for instant reservation</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">Reserved Booths</span>
                  <span className="kpi-value">{floorStats.bookedCount}</span>
                  <span className="kpi-meta">Out of {floorStats.total} floor spots</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">Starting Booth Rate</span>
                  <span className="kpi-value">
                    {floorStats.minPrice > 0 ? `$${floorStats.minPrice.toLocaleString()}` : '—'}
                  </span>
                  <span className="kpi-meta">Across open exhibition zones</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">Your Bookings</span>
                  <span className="kpi-value">{floorStats.myReservations.length}</span>
                  <span className="kpi-meta">Confirmed in current event</span>
                </div>
              </div>

              <div className="grid-12">
                <section className="panel col-span-8">
                  <FloorPlanMap
                    booths={booths}
                    selectedBooth={selectedBooth}
                    onSelectBooth={setSelectedBooth}
                    socketConnected={socketConnected}
                  />
                </section>

                <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <section className="panel-dark">
                    <div className="panel-header">
                      <h2 className="panel-title">
                        {selectedBooth ? `Booth ${selectedBooth.boothNumber}` : 'Select a Booth'}
                      </h2>
                      {selectedBooth?.price != null && (
                        <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#f97316' }}>
                          ${Number(selectedBooth.price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {selectedBooth ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#a1a1aa' }}>Zone</span>
                            <strong>{selectedBooth.zone || 'Main Hall'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#a1a1aa' }}>Dimensions</span>
                            <strong>{selectedBooth.size || 'Standard'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#a1a1aa' }}>Status</span>
                            <strong
                              style={{
                                color: isBoothAvailable(selectedBooth.status)
                                  ? '#f97316'
                                  : '#d4d4d8',
                              }}
                            >
                              {selectedBooth.status || 'Available'}
                            </strong>
                          </div>
                          {(selectedBooth.exhibitor?.companyName ||
                            selectedBooth.exhibitorId?.companyName) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#a1a1aa' }}>Reserved By</span>
                              <strong>
                                {selectedBooth.exhibitor?.companyName ||
                                  selectedBooth.exhibitorId?.companyName}
                              </strong>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn btn-orange"
                          disabled={booking || !isBoothAvailable(selectedBooth.status)}
                          onClick={handleBookBooth}
                        >
                          <CheckCircle2 size={16} />
                          <span>
                            {booking
                              ? 'Reserving Booth...'
                              : isBoothAvailable(selectedBooth.status)
                              ? 'Book Selected Booth'
                              : 'Already Reserved'}
                          </span>
                        </button>
                      </>
                    ) : (
                      <p className="panel-caption">
                        Click on any booth block on the interactive floor map to review dimensions, pricing, and confirm your booking.
                      </p>
                    )}
                  </section>

                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <h2 className="panel-title">Zone Availability &amp; Pricing</h2>
                        <p className="panel-caption">Orange indicates zones with open inventory</p>
                      </div>
                    </div>
                    <ZonePriceSparkChart booths={booths} />
                  </section>
                </div>
              </div>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Floor Occupancy Breakdown</h2>
                    <p className="panel-caption">Live inventory across all zones</p>
                  </div>
                </div>
                <BoothAllocationDonut booths={booths} />
              </section>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <div className="section-header">
                <div>
                  <h1 className="section-title">Company Profile &amp; Branding</h1>
                  <p className="section-subtitle">
                    Configure how your organization appears on booth markers and exhibitor listings.
                  </p>
                </div>
              </div>

              <div className="grid-12">
                <section className="panel col-span-7">
                  <h2 className="panel-title">Exhibitor Details</h2>
                  <form onSubmit={handleProfileSubmit} className="form-stack">
                    <div className="field">
                      <label htmlFor="company-name">Company Name</label>
                      <input
                        id="company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Robotics Inc."
                        required
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="company-desc">Company Description</label>
                      <textarea
                        id="company-desc"
                        rows={4}
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        placeholder="Describe your products, demos, and solutions..."
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="field">
                        <label htmlFor="logo-upload">Upload Logo File</label>
                        <label
                          htmlFor="logo-upload"
                          className="btn btn-outline"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <Upload size={15} />
                          <span>Choose Image</span>
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          style={{ display: 'none' }}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="logo-url">Or Logo URL</label>
                        <input
                          id="logo-url"
                          type="text"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-orange" disabled={profileSaving}>
                      {profileSaving ? 'Saving Profile...' : 'Save Company Profile'}
                    </button>
                  </form>
                </section>

                <section className="panel-dark col-span-5">
                  <div className="panel-header">
                    <h2 className="panel-title">Live Exhibitor Card Preview</h2>
                    <span className="mono" style={{ fontSize: 11.5, color: '#f97316' }}>
                      Directory View
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 16,
                      borderRadius: 6,
                      background: '#141417',
                      border: '1px solid #27272a',
                    }}
                  >
                    <div className="logo-preview-frame" style={{ background: '#1e1e23', borderColor: '#27272a' }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Company logo preview" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 size={26} color="#f97316" />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                        {companyName || 'Your Company Name'}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#a1a1aa', marginTop: 2 }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13.5, color: '#d4d4d8', lineHeight: 1.6 }}>
                    {companyDescription ||
                      'Your company overview will appear here for event attendees and floor plan visitors.'}
                  </p>
                </section>
              </div>
            </>
          )}

          {activeTab === 'schedule' && (
            <>
              <div className="section-header">
                <div>
                  <h1 className="section-title">Confirmed Bookings &amp; Event Schedule</h1>
                  <p className="section-subtitle">
                    Review your booth reservations and session timeline for {activeEvent?.title || 'this event'}.
                  </p>
                </div>
              </div>

              <div className="grid-12">
                <section className="panel col-span-5">
                  <h2 className="panel-title">Your Reserved Booths</h2>
                  {floorStats.myReservations.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p className="panel-caption">
                        You have not booked a booth for this event yet.
                      </p>
                      <button
                        type="button"
                        className="btn btn-orange btn-sm"
                        style={{ alignSelf: 'flex-start' }}
                        onClick={() => setActiveTab('floorplan')}
                      >
                        Browse Floor Plan
                      </button>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Booth</th>
                            <th>Zone</th>
                            <th className="num-col">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {floorStats.myReservations.map((b) => (
                            <tr key={b._id}>
                              <td className="mono" style={{ fontWeight: 700 }}>
                                {b.boothNumber}
                              </td>
                              <td>{b.zone || 'Main Hall'}</td>
                              <td className="num-col">
                                {b.price ? `$${Number(b.price).toLocaleString()}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="panel col-span-7">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Event Session Timeline</h2>
                      <p className="panel-caption">{activeEvent?.location || 'Main Venue'}</p>
                    </div>
                  </div>
                  <SessionTimelineGraph schedule={activeEvent?.schedule || []} />
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default ExhibitorPortal;
