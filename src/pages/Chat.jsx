import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE } from '../components/shared';

const AV = ['#1A8A7D', '#2A5A8A', '#8B6AAE', '#C47A3A', '#5A8A6A'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef(null);
  const msgPath = 'conversations/' + conversationId + '/messages';

  const loadMessages = useCallback(async () => {
    try {
      const docs = await db.getDocs(msgPath, [], {
        field: 'createdAt',
        direction: 'ASCENDING',
      });
      setMessages(docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // Failed to load messages
    }
  }, [msgPath]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await db.getDoc('conversations', conversationId);
        if (!snap.exists()) {
          setLoading(false);
          return;
        }
        if (!cancelled) {
          setConv({ id: snap.id, ...snap.data() });
          await loadMessages();
        }
      } catch {
        // Failed to load conversation
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, loadMessages]);

  // Auto-refresh messages every 10 seconds
  useEffect(() => {
    if (!conv) return;
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [conv, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSendError('');
    setSending(true);
    try {
      const now = new Date().toISOString();
      const msgData = {
        text: text.trim(),
        senderId: user.uid,
        senderName: (user.first || '') + ' ' + (user.last || ''),
        createdAt: now,
      };
      const newId = await db.addDoc(msgPath, msgData);
      await db.updateDoc('conversations', conversationId, {
        lastMessage: text.trim().slice(0, 100),
        lastMessageAt: now,
      });
      setMessages((prev) => [...prev, { id: newId, ...msgData }]);
      setText('');
    } catch (err) {
      console.error('Send message error:', err);
      setSendError('שגיאה בשליחת ההודעה: ' + (err.message || 'נסה שוב'));
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div style={{ ...s.body, textAlign: 'center', padding: '3rem', color: '#888' }}>טוען...</div>
    );
  }

  if (!conv) {
    return (
      <div style={s.body}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>השיחה לא נמצאה</div>
        <button
          onClick={() => navigate('/messages')}
          style={{ ...s.btnPrimary, maxWidth: 200, margin: '0 auto', display: 'block' }}
        >
          חזרה להודעות
        </button>
      </div>
    );
  }

  const isGroup = conv && (conv.isGroup === true || (conv.participants || []).length > 2);
  const otherUid = isGroup ? '' : (conv.participants || []).find((p) => p !== user.uid) || '';
  const otherName = isGroup ? '' : conv.participantNames?.[otherUid] || 'משתמש';
  const headerName = isGroup ? conv.groupName || 'קבוצה' : otherName;
  const memberCount = (conv.participants || []).length;
  const headerInitials = headerName
    .split(' ')
    .map((p) => p[0] || '')
    .join('');
  const headerAvatarBg = isGroup ? '#8B6AAE' : avColor(otherUid);

  return (
    <div
      style={{
        ...s.body,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 80px)',
      }}
    >
      {/* Chat header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => navigate('/messages')}
          style={{
            background: 'none',
            border: 'none',
            color: BLUE,
            cursor: 'pointer',
            fontSize: 18,
            padding: 0,
          }}
        >
          &rarr;
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: headerAvatarBg,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 500,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {headerInitials}
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 16, color: '#222' }}>{headerName}</div>
          {isGroup && <div style={{ fontSize: 12, color: '#999' }}>({memberCount} חברים)</div>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem 0', fontSize: 14 }}>
            {isGroup ? 'התחילו שיחה בקבוצה' : `התחל שיחה עם ${otherName}`}
          </div>
        )}
        {messages.map((m) => {
          const isMine = m.senderId === user.uid;
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                direction: 'ltr',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: isMine ? BLUE : '#f0f0ee',
                  color: isMine ? '#fff' : '#222',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {isGroup && !isMine && m.senderName && (
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: avColor(m.senderId || ''),
                      marginBottom: 2,
                    }}
                  >
                    {m.senderName}
                  </div>
                )}
                <div dir="auto" style={{ whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: isMine ? 'rgba(255,255,255,0.6)' : '#aaa',
                    marginTop: 4,
                    textAlign: 'left',
                    direction: 'ltr',
                  }}
                >
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      {sendError && <div style={{ ...s.err, marginBottom: 4, fontSize: 12 }}>{sendError}</div>}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: 8,
          position: 'sticky',
          bottom: 0,
          background: '#F8FAFC',
          paddingTop: 8,
        }}
      >
        <input
          style={{ ...s.input, flex: 1 }}
          dir="auto"
          placeholder="כתוב הודעה..."
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            padding: '8px 16px',
            background: BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            opacity: !text.trim() || sending ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {sending ? '...' : 'שלח'}
        </button>
      </form>
    </div>
  );
}
