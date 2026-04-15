import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE } from '../components/shared';

const AV = ['#2563EB', '#1E40AF', '#059669', '#7A4F9A', '#B05020'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}

export default function ForumPost() {
  const { forumId, postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');

  const postPath = 'forums/' + forumId + '/posts';
  const replyPath = postPath + '/' + postId + '/replies';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await db.getDoc(postPath, postId);
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!cancelled) {
          setPost({ id: snap.id, ...snap.data() });
          const docs = await db.getDocs(replyPath, [], {
            field: 'createdAt',
            direction: 'ASCENDING',
          });
          setReplies(docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch {
        setNotFound(true);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [forumId, postId]);

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;
    setReplyError('');
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const data = {
        body: replyText.trim(),
        authorId: user.uid,
        authorName: (user.first || '') + ' ' + (user.last || ''),
        createdAt: now,
      };
      const newId = await db.addDoc(replyPath, data);
      await db.updateDoc(postPath, postId, {
        replyCount: (post.replyCount || 0) + 1,
        lastReplyAt: now,
      });
      setReplies((prev) => [...prev, { id: newId, ...data }]);
      setPost((prev) => ({ ...prev, replyCount: (prev.replyCount || 0) + 1 }));
      setReplyText('');
    } catch (err) {
      console.error('Reply error:', err);
      setReplyError('שגיאה בשליחת התגובה: ' + (err.message || 'נסה שוב'));
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div style={{ ...s.body, textAlign: 'center', padding: '3rem', color: '#888' }}>טוען...</div>
    );
  }

  if (notFound) {
    return (
      <div style={s.body}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>הפוסט לא נמצא</div>
        <button
          onClick={() => navigate('/forums/' + forumId)}
          style={{ ...s.btnPrimary, maxWidth: 200, margin: '0 auto', display: 'block' }}
        >
          חזרה לנושא
        </button>
      </div>
    );
  }

  return (
    <div style={s.body}>
      <button
        onClick={() => navigate('/forums/' + forumId)}
        style={{
          background: 'none',
          border: 'none',
          color: BLUE,
          cursor: 'pointer',
          fontSize: 14,
          padding: 0,
          marginBottom: '1rem',
        }}
      >
        &rarr; חזרה לנושא
      </button>

      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: avColor(post.authorId || post.id),
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {(post.authorName || '')
              .split(' ')
              .map((x) => x[0] || '')
              .join('')}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: '#333' }}>{post.authorName}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString('he-IL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </div>
          </div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: '0 0 10px', color: '#222' }}>
          {post.title}
        </h1>
        <div style={{ fontSize: 14, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {post.body}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 500, color: '#222', margin: '16px 0 10px' }}>
        תגובות ({replies.length})
      </div>

      {replies.length === 0 ? (
        <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
          אין תגובות עדיין. היה הראשון להגיב!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {replies.map((r) => (
            <div key={r.id} style={{ ...s.card, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: avColor(r.authorId || r.id),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 500,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {(r.authorName || '')
                    .split(' ')
                    .map((x) => x[0] || '')
                    .join('')}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{r.authorName}</span>
                <span style={{ fontSize: 11, color: '#aaa' }}>
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString('he-IL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              <div
                style={{ fontSize: 14, color: '#444', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
              >
                {r.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {replyError && (
        <div style={{ ...s.err, marginBottom: 8, fontSize: 13 }}>{replyError}</div>
      )}
      <form
        onSubmit={handleReply}
        style={{ ...s.card, display: 'flex', gap: 8, alignItems: 'flex-start' }}
      >
        <textarea
          style={{ ...s.textarea, flex: 1, minHeight: 44 }}
          dir="rtl"
          placeholder="כתוב תגובה..."
          maxLength={2000}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!replyText.trim() || submitting}
          style={{
            padding: '10px 16px',
            background: BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            opacity: !replyText.trim() || submitting ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {submitting ? '...' : 'הגב'}
        </button>
      </form>
    </div>
  );
}
