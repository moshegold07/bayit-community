import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE } from '../components/shared';

const AV = ['#1A8A7D', '#2A5A8A', '#8B6AAE', '#C47A3A', '#5A8A6A'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toParam = searchParams.get('to');
  const toNameParam = searchParams.get('name');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Step 1: Load conversations
      let convs = [];
      try {
        const docs = await db.getDocs(
          'conversations',
          [{ field: 'participants', op: 'ARRAY_CONTAINS', value: user.uid }],
          { field: 'lastMessageAt', direction: 'DESCENDING' },
        );
        convs = docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!cancelled) setConversations(convs);
      } catch (err) {
        console.error('Load conversations error:', err);
        // Try loading without orderBy (may be missing composite index)
        try {
          const docs = await db.getDocs('conversations', [
            { field: 'participants', op: 'ARRAY_CONTAINS', value: user.uid },
          ]);
          convs = docs.map((d) => ({ id: d.id, ...d.data() }));
          convs.sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));
          if (!cancelled) setConversations(convs);
        } catch (err2) {
          console.error('Load conversations fallback error:', err2);
        }
      }

      if (cancelled) return;

      // Step 2: Handle ?to= param — open or create conversation (separate try block)
      if (toParam && toParam !== user.uid) {
        const existing = convs.find((c) => (c.participants || []).includes(toParam));
        if (existing) {
          navigate('/messages/' + existing.id, { replace: true });
          return;
        }
        try {
          const now = new Date().toISOString();
          const newId = await db.addDoc('conversations', {
            participants: [user.uid, toParam],
            participantNames: {
              [user.uid]: (user.first || '') + ' ' + (user.last || ''),
              [toParam]: toNameParam || 'משתמש',
            },
            lastMessage: '',
            lastMessageAt: now,
            createdAt: now,
          });
          if (!cancelled) navigate('/messages/' + newId, { replace: true });
          return;
        } catch (err) {
          console.error('Create conversation error:', err);
          if (!cancelled) setError('שגיאה ביצירת השיחה: ' + (err.message || 'נסה שוב'));
        }
      }

      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.uid, toParam, toNameParam, navigate]);

  if (loading) {
    return (
      <div style={{ ...s.body, textAlign: 'center', padding: '3rem', color: '#888' }}>טוען...</div>
    );
  }

  return (
    <div style={s.body}>
      <h2 style={{ margin: '0 0 16px', fontSize: 22, color: '#222' }}>הודעות</h2>

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 12,
            color: '#991B1B',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

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
