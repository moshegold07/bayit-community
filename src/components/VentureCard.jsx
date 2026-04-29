import { Link } from 'react-router-dom';
import { BLUE, BLUE_LT, BLUE_DK, GOLD, NAVY, safeHref } from './shared';
import UserLink from './UserLink';
import { parentLabel, parentOf, categoryLabel } from '../utils/categories';

export default function VentureCard({ venture }) {
  const dateStr = venture.createdAt
    ? new Date(venture.createdAt).toLocaleDateString('he-IL')
    : '—';
  const parent = venture.category ? parentOf(venture.category) : null;
  const subLabel = venture.category ? categoryLabel(venture.category) : null;
  const showParent = parent && parent !== 'other' && subLabel && subLabel !== parentLabel(parent);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E8E5DE',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            background: NAVY,
            color: GOLD,
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 14,
            padding: '3px 10px',
            fontFamily: 'monospace',
            direction: 'ltr',
            flexShrink: 0,
          }}
          title="מספר בתור הפצה"
        >
          #{venture.queueNumber ?? '—'}
        </span>
        <Link
          to={`/ventures/${venture.id}`}
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: '#222',
            textDecoration: 'none',
            flex: 1,
          }}
        >
          {venture.title}
        </Link>
        {venture.status === 'distributed' && (
          <span
            style={{
              fontSize: 10,
              background: '#EAF3DE',
              color: '#27500A',
              borderRadius: 10,
              padding: '2px 8px',
              fontWeight: 500,
            }}
          >
            הופץ
          </span>
        )}
      </div>

      {venture.story && (
        <div
          style={{
            fontSize: 13,
            color: '#555',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {venture.story}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {subLabel && (
          <span
            style={{
              fontSize: 11,
              padding: '2px 9px',
              borderRadius: 20,
              background: BLUE_LT,
              color: BLUE_DK,
              fontWeight: 500,
            }}
            title={showParent ? parentLabel(parent) + ' › ' + subLabel : subLabel}
          >
            {showParent ? parentLabel(parent) + ' · ' + subLabel : subLabel}
          </span>
        )}
        {venture.link && (
          <a
            href={safeHref(venture.link)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: BLUE,
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            לאתר המיזם ↗
          </a>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#888',
          paddingTop: 8,
          borderTop: '0.5px solid #f0f0f0',
        }}
      >
        <UserLink uid={venture.createdBy} style={{ fontSize: 11, color: '#666' }}>
          {venture.createdByName || 'חבר'}
        </UserLink>
        <span>{dateStr}</span>
      </div>
    </div>
  );
}
