import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE, TEAL, GOLD, AMBER } from '../components/shared';

const TYPE_COLORS = {
  message: '#3B7DD8',
  forum_reply: '#8B6AAE',
  event_rsvp: '#1A8A7D',
  project_join: '#E8A838',
  endorsement: '#D4A34A',
  admin: '#1A8A7D',
};

function timeAgo(isoString) {
  if (!isoString) return '';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return new Date(isoString).toLocaleDateString('he-IL');
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs(
          'notifications',
          [{ field: 'userId', op: 'EQUAL', value: user.uid }],
          { field: 'createdAt', direction: 'DESCENDING' },
        );
        const items = docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!cancelled) setNotifications(items);
      } catch (err) {
        console.error('Load notifications error:', err);
        try {
          const docs = await db.getDocs('notifications', [
            { field: 'userId', op: 'EQUAL', value: user.uid },
          ]);
          const items = docs.map((d) => ({ id: d.id, ...d.data() }));
          items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          if (!cancelled) setNotifications(items);
        } catch (err2) {
          console.error('Load notifications fallback error:', err2);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  const handleClick = useCallback(
    async (notif) => {
      if (!notif.read) {
        try {
          await db.updateDoc('notifications', notif.id, { read: true });
          setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
          );
        } catch (err) {
          console.error('Mark read error:', err);
        }
      }
      if (notif.link) navigate(notif.link);
    },
    [navigate],
  );

  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => db.updateDoc('notifications', n.id, { read: true })));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
    setMarkingAll(false);
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div style={{ ...s.body, textAlign: 'center', padding: '3rem', color: '#888' }}>טוען...</div>
    );
  }

  return (
    <div style={s.body}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, color: '#222' }}>התראות</h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              color: TEAL,
              border: `1px solid ${TEAL}`,
              borderRadius: 8,
              fontSize: 13,
              cursor: markingAll ? 'default' : 'pointer',
              opacity: markingAll ? 0.6 : 1,
            }}
          >
            {markingAll ? 'מעדכן...' : 'סמן הכל כנקראו'}
          </button>
        )}
      </div>

      {unreadCount > 0 && (
        <div style={{ fontSize: 13, color: BLUE, fontWeight: 500, marginBottom: 12 }}>
          {unreadCount} התראות חדשות
        </div>
      )}

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem 0', fontSize: 15 }}>
          אין התראות
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((notif) => {
            const dotColor = TYPE_COLORS[notif.type] || '#999';
            const isUnread = !notif.read;
            const truncatedBody =
              notif.body && notif.body.length > 100
                ? notif.body.slice(0, 100) + '...'
                : notif.body || '';

            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  ...s.card,
                  background: isUnread ? '#F0F7FF' : '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = BLUE)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E8E5DE')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: dotColor,
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          color: '#222',
                          fontWeight: isUnread ? 600 : 400,
                        }}
                      >
                        {notif.title}
                      </span>
                      <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0, marginLeft: 8 }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    {truncatedBody && (
                      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.4 }}>
                        {truncatedBody}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
