import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE } from '../components/shared';

const AV = ['#2563EB', '#1E40AF', '#059669', '#7A4F9A', '#B05020'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs(
          'conversations',
          [{ field: 'participants', op: 'ARRAY_CONTAINS', value: user.uid }],
          { field: 'lastMessageAt', direction: 'DESCENDING' },
        );
        const convs = docs.map((d) => ({ id: d.id, ...d.data() }));
        if (cancelled) return;
        setConversations(convs);

        // Handle ?to= param — open or create conversation
        const toUid = searchParams.get('to');
        const toName = searchParams.get('name');
        if (toUid && toUid !== user.uid) {
          const existing = convs.find((c) => (c.participants || []).includes(toUid));
          if (existing) {
            navigate('/messages/' + existing.id, { replace: true });
            return;
          }
          const now = new Date().toISOString();
          const newId = await db.addDoc('conversations', {
            participants: [user.uid, toUid],
            participantNames: {
              [user.uid]: (user.first || '') + ' ' + (user.last || ''),
              [toUid]: toName || 'משתמש',
            },
            lastMessage: '',
            lastMessageAt: now,
            createdAt: now,
          });
          navigate('/messages/' + newId, { replace: true });
          return;
        }
      } catch {
        // Failed to load conversations
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  if (loading) {
    return (
      <div style={{ ...s.body, textAlign: 'center', padding: '3rem', color: '#888' }}>טוען...</div>
    );
  }

  return (
    <div style={s.body}>
      <h2 style={{ margin: '0 0 16px', fontSize: 22, color: '#222' }}>הודעות</h2>

      {conversations.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem 0', fontSize: 15 }}>
          אין הודעות עדיין
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {conversations.map((c) => {
            const otherUid = (c.participants || []).find((p) => p !== user.uid) || '';
            const otherName = c.participantNames?.[otherUid] || 'משתמש';
            const initials = otherName
              .split(' ')
              .map((p) => p[0] || '')
              .join('');
            return (
              <div
                key={c.id}
                onClick={() => navigate('/messages/' + c.id)}
                style={{ ...s.card, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = BLUE)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: avColor(otherUid),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ fontWeight: 500, fontSize: 15, color: '#222' }}>
                        {otherName}
                      </span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>
                        {c.lastMessageAt
                          ? new Date(c.lastMessageAt).toLocaleDateString('he-IL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    {c.lastMessage && (
                      <div
                        style={{
                          fontSize: 13,
                          color: '#888',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.lastMessage.length > 60
                          ? c.lastMessage.slice(0, 60) + '...'
                          : c.lastMessage}
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
