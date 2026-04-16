import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { s } from './shared';

const TYPE_CONFIG = {
  member_joined: { color: '#1A8A7D', verb: 'הצטרף/ה לקהילה' },
  event_created: { color: '#3B7DD8', verb: 'יצר/ה אירוע' },
  project_posted: { color: '#E8A838', verb: 'פרסם/ה פרויקט' },
  forum_topic: { color: '#8B6AAE', verb: 'פתח/ה נושא' },
  resource_shared: { color: '#D4A34A', verb: 'שיתף/ה תוכן' },
  poll_created: { color: '#7C5CBF', verb: 'יצר/ה סקר' },
};

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 60) return `לפני ${Math.max(diffMin, 1)} דקות`;
  if (diffHr < 24) return `לפני ${diffHr} שעות`;
  return `לפני ${diffDay} ימים`;
}

export default function ActivityFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const docs = await db.getDocs(
          'activityFeed',
          [],
          { field: 'createdAt', direction: 'DESCENDING' },
          15,
        );
        setItems(docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setItems([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ ...s.card, direction: 'rtl' }}>
      <div
        style={{
          fontWeight: 600,
          fontSize: 16,
          marginBottom: 12,
          color: '#1C2638',
        }}
      >
        פעילות אחרונה
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#888', fontSize: 13 }}>
          טוען...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#888', fontSize: 13 }}>
          אין פעילות עדיין
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((entry) => {
            const cfg = TYPE_CONFIG[entry.type] || { color: '#888', verb: entry.type };
            return (
              <Link
                key={entry.id}
                to={entry.link || '#'}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '6px 0',
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: cfg.color,
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#333',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{entry.actorName}</span>{' '}
                      <span style={{ color: '#666' }}>{cfg.verb}</span>
                      {entry.title ? ': ' : ''}
                      {entry.title && <span style={{ color: '#222' }}>{entry.title}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {timeAgo(entry.createdAt)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
