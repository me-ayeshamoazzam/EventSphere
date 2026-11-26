import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api/axiosInstance';
import FloorPlanMap from '../../components/FloorPlanMap';
import useAuthStore from '../../store/authStore';

const isBoothAvailable = (status) => {
  const normalized = (status || '').toLowerCase();
  return normalized === 'available' || normalized === '';
};

export default function FloorPlan() {
  const user = useAuthStore((state) => state.user);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      try {
        const { data } = await api.get('/api/events');
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.events || data?.data || [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0]._id);
        }
      } catch {
        if (active) setErrorMessage('Could not load events for the floor plan.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEvents();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    let active = true;
    setErrorMessage('');
    setStatusMessage('');

    const loadBooths = async () => {
      try {
        const { data } = await api.get(`/api/booths/${selectedEventId}`);
        if (!active) return;
        setBooths(Array.isArray(data) ? data : []);
        setSelectedBooth(null);
      } catch {
        if (active) {
          setBooths([]);
          setErrorMessage('Failed to load floor booths for this event.');
        }
      }
    };

    loadBooths();
    return () => {
      active = false;
    };
  }, [selectedEventId]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
    () => events.find((ev) => ev._id === selectedEventId) || null,
    [events, selectedEventId]
  );

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

  const exhibitorName =
    selectedBooth?.exhibitor?.companyName || selectedBooth?.exhibitorId?.companyName || '';

  return (
    <main style={{ background: '#f4f4f5', minHeight: '80vh' }}>
      <section
        style={{
          background: '#0a0a0b',
          color: '#ffffff',
          padding: '104px 24px 40px',
          borderBottom: '1px solid #27272a',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', color: '#ffffff', marginBottom: 8 }}>
              Live Floor Plan
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: 15 }}>
              Select an expo and click any booth to inspect exhibitors or live availability.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label htmlFor="fp-event-select" style={{ fontSize: 13, color: '#a1a1aa' }}>
              Expo:
            </label>
            <select
              id="fp-event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={loading || events.length === 0}
              style={{
                padding: '9px 12px',
                borderRadius: 6,
                border: '1px solid #27272a',
                background: '#141417',
                color: '#ffffff',
                fontSize: 13.5,
                minWidth: 260,
              }}
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 56px' }}>
        {statusMessage && (
          <div className="banner-alert banner-success" style={{ marginBottom: 16 }}>
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="banner-alert banner-error" style={{ marginBottom: 16 }}>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid-12">
          <section className="panel col-span-8">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">{activeEvent?.title || 'Exhibition Hall'}</h2>
                <p className="panel-caption">
                  {activeEvent?.location || 'Drag to pan, use controls to zoom, or filter by zone.'}
                </p>
              </div>
            </div>

            <FloorPlanMap
              booths={booths}
              selectedBooth={selectedBooth}
              onSelectBooth={setSelectedBooth}
              socketConnected={socketConnected}
            />
          </section>

          <aside className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section className="panel-dark">
              <div className="panel-header">
                <h2 className="panel-title">
                  {selectedBooth ? `Booth ${selectedBooth.boothNumber}` : 'Booth Details'}
                </h2>
                {selectedBooth?.price != null && (
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#f97316' }}>
                    ${Number(selectedBooth.price).toLocaleString()}
                  </span>
                )}
              </div>

              {selectedBooth ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
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
                          color: isBoothAvailable(selectedBooth.status) ? '#f97316' : '#e4e4e7',
                        }}
                      >
                        {selectedBooth.status || 'Available'}
                      </strong>
                    </div>
                    {exhibitorName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#a1a1aa' }}>Exhibitor</span>
                        <strong>{exhibitorName}</strong>
                      </div>
                    )}
                  </div>

                  {user?.role === 'exhibitor' && (
                    <button
                      type="button"
                      className="btn btn-orange"
                      disabled={booking || !isBoothAvailable(selectedBooth.status)}
                      onClick={handleBookBooth}
                    >
                      {booking
                        ? 'Reserving Booth...'
                        : isBoothAvailable(selectedBooth.status)
                        ? 'Book Selected Booth'
                        : 'Already Reserved'}
                    </button>
                  )}

                  {user?.role === 'admin' && (
                    <Link to="/admin" className="btn btn-orange" style={{ textDecoration: 'none' }}>
                      Manage in Admin Dashboard
                    </Link>
                  )}
                </>
              ) : (
                <p className="panel-caption">
                  Click any booth on the map to view its zone, dimensions, live status, and exhibiting company.
                </p>
              )}
            </section>

            {booths.length === 0 && !loading && (
              <section className="panel">
                <h3 className="panel-title">No Booths Configured Yet</h3>
                <p className="panel-caption">
                  This event does not have floor booths added in MongoDB yet. Create booths from the Admin Dashboard or seed sample booths into the database.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}