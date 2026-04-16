import { Link } from 'react-router-dom';
import { s, TEAL } from './shared';

const STATUS_MAP = {
  looking: { label: 'מחפש שותפים', color: '#D4922E', bg: '#FFF8EB' },
  active: { label: 'פעיל', color: '#1A8A7D', bg: '#E8F6F3' },
  completed: { label: 'הושלם', color: '#888', bg: '#f0f0f0' },
};

export default function ProjectCard({ project }) {
  const p = project;
  const status = STATUS_MAP[p.status] || STATUS_MAP.looking;

  return (
    <Link to={'/projects/' + p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          ...s.card,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          height: '100%',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = TEAL)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E8E5DE')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontWeight: 500, fontSize: 16, color: '#222', flex: 1 }}>{p.title}</div>
          <span
            style={{
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 20,
              background: status.bg,
              color: status.color,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              marginRight: 8,
            }}
          >
            {status.label}
          </span>
        </div>

        {p.categories?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {p.categories.map((cat) => (
              <span key={cat} style={s.tag}>
                {cat}
              </span>
            ))}
          </div>
        )}

        {p.description && (
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
            {p.description.slice(0, 80)}
            {p.description.length > 80 ? '...' : ''}
          </div>
        )}

        {p.lookingFor?.length > 0 && (
          <div style={{ fontSize: 12, color: '#888' }}>
            <span style={{ fontWeight: 500 }}>מחפשים: </span>
            {p.lookingFor.join(', ')}
          </div>
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
          <span style={{ fontSize: 12, color: '#888' }}>{p.memberCount || 0} חברי צוות</span>
          <span style={{ fontSize: 11, color: '#aaa' }}>לחץ לפרטים ›</span>
        </div>
      </div>
    </Link>
  );
}
