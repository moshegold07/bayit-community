import { Link } from 'react-router-dom';
import { s, BLUE, BLUE_DK, TEAL } from './shared';
import AdminContentAction, { HiddenBadge, hiddenItemStyle } from './AdminContentAction';

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

function formatDateHebrew(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function EventCard({ event, onToggleHidden, onDelete }) {
  const typeInfo = TYPE_COLORS[event.type] || TYPE_COLORS.meetup;

  return (
    <Link to={'/events/' + event.id} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          ...s.card,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...hiddenItemStyle(event.hidden),
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = TEAL)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E8E5DE')}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontWeight: 500,
              fontSize: 16,
              color: '#222',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {event.title}
            {event.hidden && <HiddenBadge />}
          </div>
          <span
            style={{
              ...s.tag,
              background: typeInfo.bg,
              color: typeInfo.color,
              flexShrink: 0,
              marginRight: 8,
            }}
          >
            {TYPE_LABELS[event.type] || event.type}
          </span>
        </div>

        <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
          {formatDateHebrew(event.date)}
          {event.time ? ` | ${event.time}` : ''}
        </div>

        {event.location && (
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{event.location}</div>
        )}

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 8,
            borderTop: '0.5px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: BLUE_DK, fontWeight: 500 }}>
            {event.rsvpCount || 0} משתתפים
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AdminContentAction
              collection="events"
              docId={event.id}
              hidden={event.hidden}
              onToggleHidden={onToggleHidden}
              onDelete={onDelete}
            />
            <span style={{ fontSize: 11, color: '#aaa' }}>לחץ לפרטים</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
