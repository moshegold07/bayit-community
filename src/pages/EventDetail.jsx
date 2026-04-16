import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE, BLUE_DK, BLUE_LT } from '../components/shared';
import AdminContentAction, { HiddenBadge, hiddenItemStyle } from '../components/AdminContentAction';

const TYPE_LABELS = {
  meetup: 'מפגש',
  workshop: 'סדנה',
  social: 'חברתי',
  online: 'אונליין',
};

const TYPE_COLORS = {
  meetup: { bg: '#E6F1FB', color: '#0F4F8A' },
  workshop: { bg: '#E8F5E9', color: '#2E7D32' },
  social: { bg: '#FFF3E0', color: '#E65100' },
  online: { bg: '#F3E5F5', color: '#6A1B9A' },
};

const AV_COLORS = ['#1A6FBF', '#0F4F8A', '#1A8080', '#7A4F9A', '#B05020'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV_COLORS[h % 5];
}

function formatDateHebrew(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [eventSnap, userDocs] = await Promise.all([
          db.getDoc('events', id),
          db.getDocs('users', [{ field: 'status', op: 'EQUAL', value: 'active' }]),
        ]);
        if (eventSnap.exists()) {
          setEvent({ id: eventSnap.id, ...eventSnap.data() });
        }
        setUsers(userDocs.map((d) => ({ uid: d.id, ...d.data() })));
      } catch (err) {
        // Failed to load event
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const isRsvpd = event?.rsvps?.includes(user?.uid);

  async function toggleRsvp() {
    if (!event || !user || rsvpLoading) return;
    setRsvpLoading(true);
    try {
      const currentRsvps = event.rsvps || [];
      let newRsvps;
      let newCount;
      if (isRsvpd) {
        newRsvps = currentRsvps.filter((uid) => uid !== user.uid);
        newCount = Math.max(0, (event.rsvpCount || 1) - 1);
      } else {
        newRsvps = [...currentRsvps, user.uid];
        newCount = (event.rsvpCount || 0) + 1;
      }

      // Optimistic update
      setEvent((prev) => ({
        ...prev,
        rsvps: newRsvps,
        rsvpCount: newCount,
        updatedAt: new Date().toISOString(),
      }));

      await db.updateDoc('events', id, {
        rsvps: newRsvps,
        rsvpCount: newCount,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      // RSVP failed
      // Revert on error
      const snap = await db.getDoc('events', id);
      if (snap.exists()) {
        setEvent({ id: snap.id, ...snap.data() });
      }
    }
    setRsvpLoading(false);
  }

  const attendees = (event?.rsvps || [])
    .map((uid) => users.find((u) => u.uid === uid))
    .filter(Boolean);

  const typeInfo = TYPE_COLORS[event?.type] || TYPE_COLORS.meetup;

  if (loading) {
    return (
      <div style={{ ...s.body, maxWidth: 700 }}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>טוען...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ ...s.body, maxWidth: 700 }}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>אירוע לא נמצא</div>
        <Link
          to="/events"
          style={{
            display: 'block',
            textAlign: 'center',
            color: BLUE,
            textDecoration: 'none',
            marginTop: 12,
          }}
        >
          חזרה לאירועים
        </Link>
      </div>
    );
  }

  return (
    <div style={{ ...s.body, maxWidth: 700 }}>
      {/* Back link */}
      <Link
        to="/events"
        style={{
          color: BLUE,
          textDecoration: 'none',
          fontSize: 14,
          display: 'inline-block',
          marginBottom: 12,
        }}
      >
        &rarr; חזרה לאירועים
      </Link>

      {/* Event card */}
      <div style={{ ...s.card, ...hiddenItemStyle(event.hidden) }}>
        {/* Title + type badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#222', margin: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {event.title}
            {event.hidden && <HiddenBadge />}
          </h1>
          <span
            style={{
              ...s.tag,
              background: typeInfo.bg,
              color: typeInfo.color,
              flexShrink: 0,
              marginRight: 10,
              fontSize: 12,
              padding: '3px 12px',
            }}
          >
            {TYPE_LABELS[event.type] || event.type}
          </span>
        </div>

        {/* Date, time, location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: '#555' }}>
            {formatDateHebrew(event.date)}
            {event.time ? ` | ${event.time}` : ''}
          </div>
          {event.location && <div style={{ fontSize: 14, color: '#888' }}>{event.location}</div>}
          <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
            מארגן/ת: <span style={{ color: '#555', fontWeight: 500 }}>{event.createdByName}</span>
            <AdminContentAction
              collection="events"
              docId={id}
              hidden={event.hidden}
              onToggleHidden={(h) => setEvent((prev) => (prev ? { ...prev, hidden: h } : prev))}
              onDelete={() => navigate('/events')}
            />
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 14,
            color: '#333',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            padding: '12px 14px',
            background: '#f9f9f7',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {event.description}
        </div>

        {/* RSVP button */}
        <button
          onClick={toggleRsvp}
          disabled={rsvpLoading}
          style={{
            width: '100%',
            padding: 12,
            background: isRsvpd ? '#fff' : BLUE,
            color: isRsvpd ? BLUE : '#fff',
            border: isRsvpd ? `2px solid ${BLUE}` : 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 500,
            cursor: rsvpLoading ? 'not-allowed' : 'pointer',
            opacity: rsvpLoading ? 0.6 : 1,
            marginBottom: 16,
          }}
        >
          {rsvpLoading ? '...' : isRsvpd ? 'ביטול הגעה' : 'אני מגיע/ה'}
        </button>

        {/* Attendees */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#555', marginBottom: 10 }}>
            משתתפים ({event.rsvpCount || 0})
          </div>
          {attendees.length === 0 ? (
            <div style={{ fontSize: 13, color: '#aaa' }}>אין משתתפים עדיין</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {attendees.map((u) => (
                <div
                  key={u.uid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: BLUE_LT,
                    borderRadius: 20,
                    padding: '4px 12px 4px 4px',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: avColor(u.phone || u.uid),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                      fontSize: 10,
                      flexShrink: 0,
                    }}
                  >
                    {(u.first?.[0] || '') + (u.last?.[0] || '')}
                  </div>
                  <span style={{ fontSize: 13, color: BLUE_DK, fontWeight: 500 }}>
                    {u.first} {u.last}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
