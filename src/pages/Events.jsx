import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE } from '../components/shared';
import EventCard from '../components/EventCard';
import CalendarView from '../components/CalendarView';
import { logActivity } from '../utils/activityLog';
import { filterHidden } from '../components/AdminContentAction';

const TYPE_OPTIONS = [
  { value: 'meetup', label: 'מפגש' },
  { value: 'workshop', label: 'סדנה' },
  { value: 'social', label: 'חברתי' },
  { value: 'online', label: 'אונליין' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  type: 'meetup',
};

export default function Events() {
  const { user, isPending } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    async function load() {
      try {
        const docs = await db.getDocs('events');
        const list = docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setEvents(list);
      } catch (err) {
        // Failed to load events
      }
      setLoading(false);
    }
    load();
  }, []);

  const isAdmin = user?.role === 'admin';
  const visibleEvents = filterHidden(events, isAdmin);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingCount = visibleEvents.filter((e) => (e.date || '') >= today).length;

  const filtered = visibleEvents.filter((e) => {
    const txt = [e.title, e.description, e.location, e.createdByName].join(' ').toLowerCase();
    const matchSearch = !search || txt.includes(search.toLowerCase());
    const matchType = !filterType || e.type === filterType;
    return matchSearch && matchType;
  });

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('נא להזין כותרת');
      return;
    }
    if (form.title.length > 100) {
      setError('כותרת עד 100 תווים');
      return;
    }
    if (!form.description.trim()) {
      setError('נא להזין תיאור');
      return;
    }
    if (form.description.length > 2000) {
      setError('תיאור עד 2000 תווים');
      return;
    }
    if (!form.date) {
      setError('נא לבחור תאריך');
      return;
    }
    if (!form.time) {
      setError('נא לבחור שעה');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (form.date < today) {
      setError('לא ניתן ליצור אירוע בתאריך שעבר');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const newEvent = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        type: form.type,
        createdBy: user.uid,
        createdByName: (user.first || '') + ' ' + (user.last || ''),
        rsvps: [user.uid],
        rsvpCount: 1,
        createdAt: now,
        updatedAt: now,
      };
      const id = await db.addDoc('events', newEvent);
      logActivity({
        type: 'event_created',
        actorName: newEvent.createdByName,
        title: newEvent.title,
        link: '/events/' + id,
      });
      setEvents((prev) => {
        const updated = [{ id, ...newEvent }, ...prev];
        updated.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        return updated;
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      console.error('Event create error:', err);
      setError('שגיאה ביצירת האירוע: ' + (err.message || 'נסה שוב'));
    }
    setSaving(false);
  }

  const selStyle = { ...s.input, flex: 1, minWidth: 130 };

  return (
    <div style={{ ...s.body, maxWidth: 900 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#222', margin: 0 }}>אירועים</h1>
        {!isPending && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              padding: '8px 18px',
              background: BLUE,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {showForm ? 'ביטול' : 'יצירת אירוע חדש'}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={{ ...s.card, marginBottom: '1rem' }}>
          <form onSubmit={handleCreate}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 12, color: '#222' }}>
              אירוע חדש
            </div>

            <div style={s.fieldRow}>
              <label style={s.label}>כותרת *</label>
              <input
                style={s.input}
                dir="auto"
                maxLength={100}
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="שם האירוע"
              />
            </div>

            <div style={s.fieldRow}>
              <label style={s.label}>תיאור *</label>
              <textarea
                style={{ ...s.textarea, minHeight: 80 }}
                dir="auto"
                maxLength={2000}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="פרטים על האירוע"
              />
            </div>

            <div style={s.twoCol}>
              <div style={s.fieldRow}>
                <label style={s.label}>תאריך *</label>
                <input
                  style={s.input}
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>
              <div style={s.fieldRow}>
                <label style={s.label}>שעה *</label>
                <input
                  style={s.input}
                  type="time"
                  value={form.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                />
              </div>
            </div>

            <div style={s.twoCol}>
              <div style={s.fieldRow}>
                <label style={s.label}>מיקום</label>
                <input
                  style={s.input}
                  dir="auto"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="כתובת או Zoom"
                />
              </div>
              <div style={s.fieldRow}>
                <label style={s.label}>סוג</label>
                <select
                  style={s.input}
                  dir="rtl"
                  value={form.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div style={s.err}>{error}</div>}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...s.btnPrimary,
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'שומר...' : 'צור אירוע'}
            </button>
          </form>
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          style={{ ...s.input, flex: 2, minWidth: 180 }}
          placeholder="חיפוש אירועים..."
          dir="auto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={selStyle}
          dir="rtl"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">כל הסוגים</option>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
        {[
          ['סה"כ אירועים', events.length],
          ['אירועים קרובים', upcomingCount],
        ].map(([label, val]) => (
          <div
            key={label}
            style={{
              background: '#fff',
              border: '1px solid #E8E5DE',
              borderRadius: 8,
              padding: '10px 16px',
              flex: 1,
            }}
          >
            <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: BLUE }}>{val}</div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #ddd',
          marginBottom: '1rem',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setViewMode('list')}
          style={{
            padding: '6px 16px',
            fontSize: 13,
            border: 'none',
            cursor: 'pointer',
            background: viewMode === 'list' ? BLUE : '#fff',
            color: viewMode === 'list' ? '#fff' : '#666',
            fontWeight: viewMode === 'list' ? 600 : 400,
          }}
        >
          רשימה
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          style={{
            padding: '6px 16px',
            fontSize: 13,
            border: 'none',
            borderRight: '1px solid #ddd',
            cursor: 'pointer',
            background: viewMode === 'calendar' ? BLUE : '#fff',
            color: viewMode === 'calendar' ? '#fff' : '#666',
            fontWeight: viewMode === 'calendar' ? 600 : 400,
          }}
        >
          לוח שנה
        </button>
      </div>

      {/* Event List / Calendar */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>טוען...</div>
      ) : viewMode === 'calendar' ? (
        <CalendarView events={filtered} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
            gap: 12,
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#888' }}
            >
              אין אירועים כרגע
            </div>
          )}
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onToggleHidden={(h) =>
                setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, hidden: h } : e)))
              }
              onDelete={() => setEvents((prev) => prev.filter((e) => e.id !== event.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
