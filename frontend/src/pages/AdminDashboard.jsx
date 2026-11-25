import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Check,
  Download,
  LogOut,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import {
  BoothAllocationDonut,
  OccupancyBarLineChart,
  SessionTimelineGraph,
} from '../components/AnalyticsCharts';
import FloorPlanMap from '../components/FloorPlanMap';

const emptySession = () => ({
  sessionTitle: '',
  speakerName: '',
  startTime: '',
  endTime: '',
  locationDetails: '',
});

const emptyEventForm = () => ({
  title: '',
  description: '',
  theme: '',
  startDate: '',
  endDate: '',
  location: '',
  schedule: [emptySession()],
});

const emptyBoothForm = () => ({
  boothNumber: '',
  zone: 'Main Hall',
  size: 'Standard (10x20)',
  price: '3200',
  x: '480',
  y: '325',
  width: '105',
  height: '68',
});

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const formatDateShort = (value) => {
  if (!value) return 'TBD';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [booths, setBooths] = useState([]);
  const [exhibitors, setExhibitors] = useState([]);

  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState(null);
  const [boothForm, setBoothForm] = useState(emptyBoothForm);
  const [selectedBooth, setSelectedBooth] = useState(null);

  const [eventSearch, setEventSearch] = useState('');
  const [exhibitorFilter, setExhibitorFilter] = useState('pending');
  const [exhibitorSearch, setExhibitorSearch] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadBoothsForEvent = useCallback(async (evtId) => {
    if (!evtId) {
      setBooths([]);
      return;
    }
    try {
      const { data } = await api.get(`/api/booths/${evtId}`);
      setBooths(Array.isArray(data) ? data : []);
    } catch {
      setBooths([]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const [eventsRes, exhibitorsRes] = await Promise.allSettled([
      api.get('/api/events'),
      api.get('/api/users/exhibitors/pending'),
    ]);

    if (eventsRes.status === 'fulfilled') {
      const evList = Array.isArray(eventsRes.value.data) ? eventsRes.value.data : [];
      setEvents(evList);
      setSelectedEventId((prev) => {
        const nextId = prev && evList.some((e) => e._id === prev) ? prev : evList[0]?._id || '';
        return nextId;
      });
    }
    if (exhibitorsRes.status === 'fulfilled') {
      const exList = Array.isArray(exhibitorsRes.value.data) ? exhibitorsRes.value.data : [];
      setExhibitors(exList);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const [eventsRes, exhibitorsRes] = await Promise.allSettled([
        api.get('/api/events'),
        api.get('/api/users/exhibitors/pending'),
      ]);
      if (!active) return;

      if (eventsRes.status === 'fulfilled') {
        const evList = Array.isArray(eventsRes.value.data) ? eventsRes.value.data : [];
        setEvents(evList);
        if (evList.length > 0) {
          setSelectedEventId(evList[0]._id);
        }
      }
      if (exhibitorsRes.status === 'fulfilled') {
        setExhibitors(
          Array.isArray(exhibitorsRes.value.data) ? exhibitorsRes.value.data : []
        );
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchBooths = async () => {
      if (!selectedEventId) return;
      try {
        const { data } = await api.get(`/api/booths/${selectedEventId}`);
        if (!active) return;
        setBooths(Array.isArray(data) ? data : []);
        setSelectedBooth(null);
      } catch {
        if (active) setBooths([]);
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
      setBooths((prev) => {
        const exists = prev.some((b) => b._id === updatedBooth._id);
        if (exists) {
          return prev.map((b) => (b._id === updatedBooth._id ? { ...b, ...updatedBooth } : b));
        }
        if ((updatedBooth.eventId || updatedBooth.event) === selectedEventId) {
          return [...prev, updatedBooth];
        }
        return prev;
      });
    });
    return () => {
      socket.disconnect();
    };
  }, [selectedEventId]);

  // Derived metrics for Overview & Charts
  const metrics = useMemo(() => {
    const totalBooths = booths.length;
    const bookedBooths = booths.filter((b) => {
      const s = (b.status || '').toLowerCase();
      return s === 'booked' || s === 'reserved';
    });
    const occupancyRate =
      totalBooths > 0 ? Math.round((bookedBooths.length / totalBooths) * 100) : 0;
    const confirmedRevenue = bookedBooths.reduce(
      (sum, b) => sum + (Number(b.price) || 2500),
      0
    );
    const pendingCount = exhibitors.filter(
      (ex) => ex.status === 'pending' || (!ex.status && !ex.isApproved)
    ).length;

    return {
      totalEvents: events.length,
      totalSessions: events.reduce((sum, ev) => sum + (ev.schedule?.length || 0), 0),
      totalBooths,
      bookedCount: bookedBooths.length,
      occupancyRate,
      confirmedRevenue,
      pendingCount,
    };
  }, [booths, events, exhibitors]);

  const activeEvent = useMemo(
    () => events.find((e) => e._id === selectedEventId) || events[0] || null,
    [events, selectedEventId]
  );

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (ev) =>
        (ev.title || '').toLowerCase().includes(q) ||
        (ev.location || '').toLowerCase().includes(q) ||
        (ev.theme || '').toLowerCase().includes(q)
    );
  }, [events, eventSearch]);

  const filteredExhibitors = useMemo(() => {
    return exhibitors.filter((ex) => {
      const status = ex.status || (ex.isApproved ? 'approved' : 'pending');
      if (exhibitorFilter !== 'all' && status !== exhibitorFilter) return false;
      if (exhibitorSearch.trim()) {
        const q = exhibitorSearch.trim().toLowerCase();
        const name = (ex.companyName || ex.name || '').toLowerCase();
        const email = (ex.email || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [exhibitors, exhibitorFilter, exhibitorSearch]);

  const handleFieldChange = (field, value) => {
    setEventForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSessionChange = (index, field, value) => {
    setEventForm((prev) => ({
      ...prev,
      schedule: prev.schedule.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addSessionRow = () => {
    setEventForm((prev) => ({
      ...prev,
      schedule: [...prev.schedule, emptySession()],
    }));
  };

  const removeSessionRow = (index) => {
    setEventForm((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');
    setSubmitting(true);

    const cleanedSchedule = eventForm.schedule.filter(
      (s) => s.sessionTitle.trim() !== '' || s.speakerName.trim() !== ''
    );

    const payload = {
      title: eventForm.title,
      description: eventForm.description,
      theme: eventForm.theme,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate,
      location: eventForm.location,
      schedule: cleanedSchedule,
    };

    try {
      if (editingEventId) {
        await api.put(`/api/events/${editingEventId}`, payload);
        setStatusMessage('Event and schedule updated.');
      } else {
        await api.post('/api/events', payload);
        setStatusMessage('New event created.');
      }
      setEventForm(emptyEventForm());
      setEditingEventId(null);
      await refreshAll();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Failed to save event.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEvent = (ev) => {
    setStatusMessage('');
    setErrorMessage('');
    setEditingEventId(ev._id);
    setSelectedEventId(ev._id);
    setEventForm({
      title: ev.title || '',
      description: ev.description || '',
      theme: ev.theme || '',
      startDate: toInputDateTime(ev.startDate),
      endDate: toInputDateTime(ev.endDate),
      location: ev.location || '',
      schedule:
        Array.isArray(ev.schedule) && ev.schedule.length > 0
          ? ev.schedule.map((s) => ({
              sessionTitle: s.sessionTitle || '',
              speakerName: s.speakerName || '',
              startTime: toInputDateTime(s.startTime),
              endTime: toInputDateTime(s.endTime),
              locationDetails: s.locationDetails || '',
            }))
          : [emptySession()],
    });
    setActiveTab('events');
  };

  const handleDeleteEvent = async (eventId) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      await api.delete(`/api/events/${eventId}`);
      setStatusMessage('Event deleted.');
      if (editingEventId === eventId) {
        setEditingEventId(null);
        setEventForm(emptyEventForm());
      }
      await refreshAll();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Failed to delete event.'
      );
    }
  };

  const handleApproveExhibitor = async (exhibitorId) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      await api.put(`/api/users/exhibitors/${exhibitorId}/approve`);
      setExhibitors((prev) =>
        prev.map((ex) =>
          ex._id === exhibitorId ? { ...ex, isApproved: true, status: 'approved' } : ex
        )
      );
      setStatusMessage('Exhibitor application approved.');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Approval failed.'
      );
    }
  };

  const handleRejectExhibitor = async (exhibitorId) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      await api.put(`/api/users/exhibitors/${exhibitorId}/reject`);
      setExhibitors((prev) =>
        prev.map((ex) =>
          ex._id === exhibitorId ? { ...ex, isApproved: false, status: 'rejected' } : ex
        )
      );
      setStatusMessage('Exhibitor application rejected.');
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Rejection failed.'
      );
    }
  };

  const handleCreateBooth = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      setErrorMessage('Select an event before placing a booth.');
      return;
    }
    setStatusMessage('');
    setErrorMessage('');
    try {
      const payload = {
        eventId: selectedEventId,
        event: selectedEventId,
        boothNumber: boothForm.boothNumber,
        zone: boothForm.zone,
        size: boothForm.size,
        price: Number(boothForm.price) || 2500,
        coordinates: {
          x: Number(boothForm.x) || 40,
          y: Number(boothForm.y) || 70,
          width: Number(boothForm.width) || 105,
          height: Number(boothForm.height) || 70,
        },
      };
      await api.post('/api/booths', payload);
      setBoothForm((prev) => ({ ...emptyBoothForm(), zone: prev.zone }));
      setStatusMessage(`Booth ${payload.boothNumber} added to floor plan.`);
      await loadBoothsForEvent(selectedEventId);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Failed to add booth.'
      );
    }
  };

  const handleExportEventsCsv = () => {
    const header = ['Title', 'Theme', 'Location', 'Start Date', 'End Date', 'Sessions'];
    const rows = events.map((ev) => [
      `"${(ev.title || '').replace(/"/g, '""')}"`,
      `"${(ev.theme || '').replace(/"/g, '""')}"`,
      `"${(ev.location || '').replace(/"/g, '""')}"`,
      ev.startDate || '',
      ev.endDate || '',
      ev.schedule?.length || 0,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eventsphere-events.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabTitles = {
    overview: 'Overview & Analytics',
    events: 'Events & Schedule Builder',
    approvals: 'Exhibitor Approvals',
    floorplan: 'Floor Plan & Booth Map',
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
            <div className="sidebar-section-label">Admin Console</div>
            <nav className="sidebar-nav" aria-label="Admin navigation">
              <button
                type="button"
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <span className="nav-item-left">
                  <BarChart3 size={16} className="nav-icon" />
                  <span>Overview</span>
                </span>
              </button>

              <button
                type="button"
                className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                <span className="nav-item-left">
                  <CalendarDays size={16} className="nav-icon" />
                  <span>Events &amp; Schedules</span>
                </span>
                <span className="nav-count">{events.length}</span>
              </button>

              <button
                type="button"
                className={`nav-item ${activeTab === 'approvals' ? 'active' : ''}`}
                onClick={() => setActiveTab('approvals')}
              >
                <span className="nav-item-left">
                  <UserCheck size={16} className="nav-icon" />
                  <span>Exhibitor Approvals</span>
                </span>
                {metrics.pendingCount > 0 && (
                  <span className="nav-count">{metrics.pendingCount}</span>
                )}
              </button>

              <button
                type="button"
                className={`nav-item ${activeTab === 'floorplan' ? 'active' : ''}`}
                onClick={() => setActiveTab('floorplan')}
              >
                <span className="nav-item-left">
                  <MapPin size={16} className="nav-icon" />
                  <span>Floor Plan Map</span>
                </span>
              </button>
            </nav>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-account-box">
            <div className="user-account-name">{user?.name || 'Admin'}</div>
            <div className="user-account-meta">{user?.email} · Admin</div>
          </div>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm"
            onClick={logout}
          >
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
            <span>Admin Console</span>
            <span aria-hidden="true">/</span>
            <span className="breadcrumb-current">{tabTitles[activeTab]}</span>
          </div>

          <div className="topbar-actions">
            <select
              aria-label="Active event context"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                border: '1px solid #d4d4d8',
                fontSize: 13,
                background: '#ffffff',
                maxWidth: 230,
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
              onClick={() => {
                setEditingEventId(null);
                setEventForm(emptyEventForm());
                setActiveTab('events');
              }}
            >
              <Plus size={14} />
              <span>New Event</span>
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

          {activeTab === 'overview' && (
            <>
              <div className="section-header">
                <div>
                  <h1 className="section-title">Operations Overview</h1>
                  <p className="section-subtitle">
                    Real-time booth occupancy, revenue analytics, and approval queue for{' '}
                    <strong>{activeEvent?.title || 'all events'}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleExportEventsCsv}
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">Active Events</span>
                  <span className="kpi-value">{metrics.totalEvents}</span>
                  <span className="kpi-meta">{metrics.totalSessions} scheduled sessions</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">Floor Occupancy</span>
                  <span className="kpi-value">{metrics.occupancyRate}%</span>
                  <span className="kpi-meta">
                    {metrics.bookedCount} of {metrics.totalBooths} booths booked
                  </span>
                </div>

                <div className="kpi-card kpi-highlight">
                  <span className="kpi-label">Pending Approvals</span>
                  <span className="kpi-value">{metrics.pendingCount}</span>
                  <span className="kpi-meta">Exhibitors awaiting review</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">Confirmed Booth Revenue</span>
                  <span className="kpi-value">
                    ${metrics.confirmedRevenue.toLocaleString()}
                  </span>
                  <span className="kpi-meta">{activeEvent?.location || 'Selected event'}</span>
                </div>
              </div>

              <div className="grid-12">
                <section className="panel col-span-7">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Zone Occupancy &amp; Revenue Graph</h2>
                      <p className="panel-caption">
                        Orange bars indicate booked booths · Black line tracks zone revenue
                      </p>
                    </div>
                  </div>
                  <OccupancyBarLineChart booths={booths} events={events} />
                </section>

                <section className="panel col-span-5">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Booth Status Allocation</h2>
                      <p className="panel-caption">Distribution across current floor plan</p>
                    </div>
                  </div>
                  <BoothAllocationDonut booths={booths} />
                </section>
              </div>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Session Schedule Timeline</h2>
                    <p className="panel-caption">
                      Hourly session coverage for {activeEvent?.title || 'selected event'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setActiveTab('events')}
                  >
                    Manage Schedules
                  </button>
                </div>
                <SessionTimelineGraph schedule={activeEvent?.schedule || []} />
              </section>
            </>
          )}

          {activeTab === 'events' && (
            <>
              <div className="section-header">
                <div>
                  <h1 className="section-title">Events &amp; Schedule Builder</h1>
                  <p className="section-subtitle">
                    Create events, configure multi-session tracks, and manage schedules.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleExportEventsCsv}
                >
                  <Download size={14} />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="grid-12">
                <section className="panel col-span-6">
                  <div className="panel-header">
                    <h2 className="panel-title">
                      {editingEventId ? 'Edit Event & Schedule' : 'Create New Event'}
                    </h2>
                    {editingEventId && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setEditingEventId(null);
                          setEventForm(emptyEventForm());
                        }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleEventSubmit} className="form-stack">
                    <div className="field">
                      <label htmlFor="event-title">Event Title</label>
                      <input
                        id="event-title"
                        type="text"
                        value={eventForm.title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        placeholder="Global Tech & Robotics Summit"
                        required
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="field">
                        <label htmlFor="event-theme">Theme</label>
                        <input
                          id="event-theme"
                          type="text"
                          value={eventForm.theme}
                          onChange={(e) => handleFieldChange('theme', e.target.value)}
                          placeholder="Autonomous Systems"
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="event-location">Venue Location</label>
                        <input
                          id="event-location"
                          type="text"
                          value={eventForm.location}
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          placeholder="Hall A · Convention Center"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="field">
                        <label htmlFor="event-start">Start Date</label>
                        <input
                          id="event-start"
                          type="datetime-local"
                          value={eventForm.startDate}
                          onChange={(e) => handleFieldChange('startDate', e.target.value)}
                          required
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="event-end">End Date</label>
                        <input
                          id="event-end"
                          type="datetime-local"
                          value={eventForm.endDate}
                          onChange={(e) => handleFieldChange('endDate', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="event-desc">Description</label>
                      <textarea
                        id="event-desc"
                        rows={2}
                        value={eventForm.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder="Summary of event scope and exhibition tracks..."
                      />
                    </div>

                    <hr className="divider" />

                    <div className="panel-header">
                      <h3 className="panel-title">Session Schedule Builder</h3>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={addSessionRow}
                      >
                        <Plus size={14} />
                        <span>Add Session</span>
                      </button>
                    </div>

                    <div className="schedule-list">
                      {eventForm.schedule.map((session, index) => (
                        <div key={index} className="schedule-item">
                          <div className="form-grid-2">
                            <div className="field">
                              <label>Session Title</label>
                              <input
                                type="text"
                                value={session.sessionTitle}
                                onChange={(e) =>
                                  handleSessionChange(index, 'sessionTitle', e.target.value)
                                }
                                placeholder="Opening Keynote"
                              />
                            </div>
                            <div className="field">
                              <label>Speaker Name</label>
                              <input
                                type="text"
                                value={session.speakerName}
                                onChange={(e) =>
                                  handleSessionChange(index, 'speakerName', e.target.value)
                                }
                                placeholder="Dr. Nadia Qureshi"
                              />
                            </div>
                          </div>

                          <div className="form-grid-2">
                            <div className="field">
                              <label>Start Time</label>
                              <input
                                type="datetime-local"
                                value={session.startTime}
                                onChange={(e) =>
                                  handleSessionChange(index, 'startTime', e.target.value)
                                }
                              />
                            </div>
                            <div className="field">
                              <label>End Time</label>
                              <input
                                type="datetime-local"
                                value={session.endTime}
                                onChange={(e) =>
                                  handleSessionChange(index, 'endTime', e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                              alignItems: 'flex-end',
                            }}
                          >
                            <div className="field" style={{ flex: 1 }}>
                              <label>Hall / Room</label>
                              <input
                                type="text"
                                value={session.locationDetails}
                                onChange={(e) =>
                                  handleSessionChange(index, 'locationDetails', e.target.value)
                                }
                                placeholder="Main Stage"
                              />
                            </div>
                            {eventForm.schedule.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-danger-outline btn-sm"
                                onClick={() => removeSessionRow(index)}
                              >
                                <Trash2 size={14} />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button type="submit" className="btn btn-orange" disabled={submitting}>
                      {submitting
                        ? 'Saving...'
                        : editingEventId
                        ? 'Update Event'
                        : 'Create Event'}
                    </button>
                  </form>
                </section>

                <div className="col-span-6" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <section className="panel">
                    <div className="panel-header">
                      <h2 className="panel-title">Scheduled Events Directory</h2>
                      <div className="search-input-wrap">
                        <Search size={14} className="search-input-icon" />
                        <input
                          type="text"
                          value={eventSearch}
                          onChange={(e) => setEventSearch(e.target.value)}
                          placeholder="Search events..."
                          aria-label="Search events"
                        />
                      </div>
                    </div>

                    {filteredEvents.length === 0 ? (
                      <p className="panel-caption">No events match your filter.</p>
                    ) : (
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Event</th>
                              <th>Dates</th>
                              <th className="num-col">Sessions</th>
                              <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEvents.map((ev) => (
                              <tr key={ev._id}>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{ev.title}</div>
                                  <div style={{ fontSize: 12, color: '#71717a' }}>
                                    {ev.location}
                                    {ev.theme ? ` · ${ev.theme}` : ''}
                                  </div>
                                </td>
                                <td className="tabular-nums" style={{ fontSize: 12.5, color: '#52525b' }}>
                                  {formatDateShort(ev.startDate)}
                                </td>
                                <td className="num-col">{ev.schedule?.length || 0}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: 6 }}>
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      onClick={() => handleEditEvent(ev)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-danger-outline btn-sm"
                                      onClick={() => handleDeleteEvent(ev._id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="panel">
                    <div className="panel-header">
                      <div>
                        <h2 className="panel-title">Timeline Graph · {activeEvent?.title || 'Event'}</h2>
                        <p className="panel-caption">Keynote sessions highlighted in orange</p>
                      </div>
                    </div>
                    <SessionTimelineGraph schedule={activeEvent?.schedule || []} />
                  </section>
                </div>
              </div>
            </>
          )}

          {activeTab === 'approvals' && (
            <>
              <div className="section-header">
                <div>
                  <h1 className="section-title">Exhibitor Application Review</h1>
                  <p className="section-subtitle">
                    Verify company profiles and approve or reject exhibition booth applicants.
                  </p>
                </div>
              </div>

              <section className="panel">
                <div className="panel-header">
                  <div className="segmented-bar" role="tablist" aria-label="Filter applications">
                    {[
                      { id: 'pending', label: 'Pending' },
                      { id: 'approved', label: 'Approved' },
                      { id: 'rejected', label: 'Rejected' },
                      { id: 'all', label: 'All' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`segmented-btn ${exhibitorFilter === tab.id ? 'active-orange' : ''}`}
                        onClick={() => setExhibitorFilter(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="search-input-wrap">
                    <Search size={14} className="search-input-icon" />
                    <input
                      type="text"
                      value={exhibitorSearch}
                      onChange={(e) => setExhibitorSearch(e.target.value)}
                      placeholder="Filter company or email..."
                      aria-label="Filter exhibitors"
                    />
                  </div>
                </div>

                {filteredExhibitors.length === 0 ? (
                  <p className="panel-caption">
                    No exhibitor applications in the &ldquo;{exhibitorFilter}&rdquo; view.
                  </p>
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Company &amp; Applicant</th>
                          <th>Company Summary</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Decision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExhibitors.map((ex) => {
                          const st = ex.status || (ex.isApproved ? 'approved' : 'pending');
                          return (
                            <tr key={ex._id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>
                                  {ex.companyName || ex.name}
                                </div>
                                <div style={{ fontSize: 12, color: '#71717a' }}>
                                  {ex.name} · {ex.email}
                                </div>
                              </td>
                              <td style={{ maxWidth: 360, color: '#52525b' }}>
                                {ex.companyDescription || 'No description provided.'}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 12.5,
                                    color:
                                      st === 'pending'
                                        ? '#ea580c'
                                        : st === 'approved'
                                        ? '#16a34a'
                                        : '#dc2626',
                                  }}
                                >
                                  {st.charAt(0).toUpperCase() + st.slice(1)}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 8 }}>
                                  <button
                                    type="button"
                                    className="btn btn-orange btn-sm"
                                    disabled={st === 'approved'}
                                    onClick={() => handleApproveExhibitor(ex._id)}
                                  >
                                    <Check size={14} />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger-outline btn-sm"
                                    disabled={st === 'rejected'}
                                    onClick={() => handleRejectExhibitor(ex._id)}
                                  >
                                    <X size={14} />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === 'floorplan' && (
            <>
              <div className="section-header">
                <div>
                  <h1 className="section-title">Interactive Floor Plan &amp; Booth Map</h1>
                  <p className="section-subtitle">
                    Inspect live booth occupancy across zones and place new booths onto the canvas.
                  </p>
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
                        {selectedBooth ? `Booth ${selectedBooth.boothNumber}` : 'Booth Inspector'}
                      </h2>
                      {selectedBooth && (
                        <span className="mono" style={{ color: '#f97316', fontWeight: 700 }}>
                          {selectedBooth.price ? `$${selectedBooth.price}` : ''}
                        </span>
                      )}
                    </div>
                    {selectedBooth ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        <div>
                          Zone: <strong>{selectedBooth.zone || 'Main Hall'}</strong>
                        </div>
                        <div>
                          Dimensions: <strong>{selectedBooth.size || 'Standard'}</strong>
                        </div>
                        <div>
                          Status:{' '}
                          <strong style={{ color: '#f97316' }}>
                            {selectedBooth.status || 'Available'}
                          </strong>
                        </div>
                        <div>
                          Coordinates:{' '}
                          <span className="mono">
                            x:{selectedBooth.coordinates?.x}, y:{selectedBooth.coordinates?.y}
                          </span>
                        </div>
                        {(selectedBooth.exhibitor?.companyName ||
                          selectedBooth.exhibitorId?.companyName) && (
                          <div>
                            Assigned To:{' '}
                            <strong>
                              {selectedBooth.exhibitor?.companyName ||
                                selectedBooth.exhibitorId?.companyName}
                            </strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="panel-caption">
                        Click any booth on the Konva floor map to inspect occupancy and coordinates.
                      </p>
                    )}
                  </section>

                  <section className="panel">
                    <h2 className="panel-title">Add Floor Booth</h2>
                    <form onSubmit={handleCreateBooth} className="form-stack">
                      <div className="form-grid-2">
                        <div className="field">
                          <label htmlFor="booth-num">Booth #</label>
                          <input
                            id="booth-num"
                            type="text"
                            value={boothForm.boothNumber}
                            onChange={(e) =>
                              setBoothForm((p) => ({ ...p, boothNumber: e.target.value }))
                            }
                            placeholder="S-405"
                            required
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="booth-price">Price ($)</label>
                          <input
                            id="booth-price"
                            type="number"
                            value={boothForm.price}
                            onChange={(e) =>
                              setBoothForm((p) => ({ ...p, price: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="field">
                          <label htmlFor="booth-zone">Zone</label>
                          <select
                            id="booth-zone"
                            value={boothForm.zone}
                            onChange={(e) =>
                              setBoothForm((p) => ({ ...p, zone: e.target.value }))
                            }
                          >
                            <option value="Main Hall">Main Hall</option>
                            <option value="Tech Pavilion">Tech Pavilion</option>
                            <option value="Startup Row">Startup Row</option>
                            <option value="VIP Island">VIP Island</option>
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor="booth-size">Size</label>
                          <input
                            id="booth-size"
                            type="text"
                            value={boothForm.size}
                            onChange={(e) =>
                              setBoothForm((p) => ({ ...p, size: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="field">
                          <label htmlFor="booth-x">X Coord</label>
                          <input
                            id="booth-x"
                            type="number"
                            value={boothForm.x}
                            onChange={(e) =>
                              setBoothForm((p) => ({ ...p, x: e.target.value }))
                            }
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="booth-y">Y Coord</label>
                          <input
                            id="booth-y"
                            type="number"
                            value={boothForm.y}
                            onChange={(e) =>
                              setBoothForm((p) => ({ ...p, y: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn btn-dark">
                        <Plus size={15} />
                        <span>Add Booth to Map</span>
                      </button>
                    </form>
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
