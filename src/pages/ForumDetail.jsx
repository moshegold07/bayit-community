import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE } from '../components/shared';
import UserLink from '../components/UserLink';
import AdminContentAction, {
  HiddenBadge,
  hiddenItemStyle,
  filterHidden,
} from '../components/AdminContentAction';

const AV = ['#1A8A7D', '#2A5A8A', '#8B6AAE', '#C47A3A', '#5A8A6A'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}

export default function ForumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPending } = useAuth();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await db.getDoc('forums', id);
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!cancelled) {
          setForum({ id: snap.id, ...snap.data() });
          const docs = await db.getDocs('forums/' + id + '/posts', [], {
            field: 'createdAt',
            direction: 'DESCENDING',
          });
          setPosts(docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch {
        setNotFound(true);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const t = title.trim();
    const b = body.trim();
    if (!t) {
      setError('יש להזין כותרת');
      return;
    }
    if (!b) {
      setError('יש להזין תוכן');
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const data = {
        title: t,
        body: b,
        authorId: user.uid,
        authorName: (user.first || '') + ' ' + (user.last || ''),
        createdAt: now,
        replyCount: 0,
        lastReplyAt: now,
      };
      const newId = await db.addDoc('forums/' + id + '/posts', data);
      // Fetch fresh forum data to avoid stale postCount
      const freshForum = await db.getDoc('forums', id);
      const currentCount = freshForum.exists() ? freshForum.data().postCount || 0 : 0;
      await db.updateDoc('forums', id, {
        postCount: currentCount + 1,
        lastPostAt: now,
      });
      setPosts((prev) => [{ id: newId, ...data }, ...prev]);
      setForum((prev) => ({ ...prev, postCount: (prev.postCount || 0) + 1, lastPostAt: now }));
      setTitle('');
      setBody('');
      setShowForm(false);
    } catch (err) {
      console.error('Post create error:', err);
      setError('שגיאה ביצירת הפוסט: ' + (err.message || 'נסה שוב'));
    }
    setSubmitting(false);
  }

  const isAdmin = user?.role === 'admin';
  const visiblePosts = filterHidden(posts, isAdmin);

  function handleTogglePostHidden(postId, newHidden) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, hidden: newHidden } : p)));
  }

  function handleDeletePost(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  if (loading) {
    return (
      <div style={{ ...s.body, textAlign: 'center', padding: '3rem', color: '#888' }}>טוען...</div>
    );
  }

  if (notFound) {
    return (
      <div style={s.body}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>הנושא לא נמצא</div>
        <button
          onClick={() => navigate('/forums')}
          style={{ ...s.btnPrimary, maxWidth: 200, margin: '0 auto', display: 'block' }}
        >
          חזרה לפורומים
        </button>
      </div>
    );
  }

  return (
    <div style={s.body}>
      <button
        onClick={() => navigate('/forums')}
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
        &rarr; חזרה לפורומים
      </button>

      <div style={s.card}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 8px', color: '#222' }}>
          {forum.title}
        </h1>
        {forum.description && (
          <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 8 }}>
            {forum.description}
          </div>
        )}
        <div style={{ fontSize: 12, color: '#aaa' }}>
          נוצר ע&quot;י{' '}
          <UserLink uid={forum.createdBy} style={{ color: BLUE, fontWeight: 500 }}>
            {forum.createdByName}
          </UserLink>
          {forum.createdAt && (
            <span> &middot; {new Date(forum.createdAt).toLocaleDateString('he-IL')}</span>
          )}
          <span> &middot; {forum.postCount || 0} פוסטים</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '16px 0 12px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>פוסטים</div>
        {!isPending && (
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              ...s.btnPrimary,
              width: 'auto',
              padding: '6px 14px',
              marginTop: 0,
              fontSize: 13,
            }}
          >
            {showForm ? 'ביטול' : '+ פוסט חדש'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...s.card, marginBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>כותרת *</label>
            <input
              style={s.input}
              dir="rtl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder="כותרת הפוסט"
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>תוכן *</label>
            <textarea
              style={s.textarea}
              dir="rtl"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="כתוב את הפוסט שלך..."
            />
          </div>
          {error && <div style={s.err}>{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{ ...s.btnPrimary, opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'שולח...' : 'פרסם פוסט'}
          </button>
        </form>
      )}

      {visiblePosts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem 0', fontSize: 15 }}>
          אין פוסטים עדיין. היה הראשון לפרסם!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visiblePosts.map((p) => (
            <Link
              key={p.id}
              to={`/forums/${id}/posts/${p.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  ...s.card,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  ...hiddenItemStyle(p.hidden),
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = BLUE)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: avColor(p.authorId || p.id),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                      fontSize: 12,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {(p.authorName || '')
                      .split(' ')
                      .map((x) => x[0] || '')
                      .join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 15,
                        color: '#222',
                        marginBottom: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {p.title}
                      {p.hidden && <HiddenBadge />}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
                      {p.body?.length > 100 ? p.body.slice(0, 100) + '...' : p.body}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        fontSize: 12,
                        color: '#aaa',
                        alignItems: 'center',
                      }}
                    >
                      <UserLink uid={p.authorId} style={{ color: BLUE, fontWeight: 500 }}>
                        {p.authorName}
                      </UserLink>
                      <span>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('he-IL') : ''}
                      </span>
                      <span>{p.replyCount || 0} תגובות</span>
                      <AdminContentAction
                        collection={'forums/' + id + '/posts'}
                        docId={p.id}
                        hidden={p.hidden}
                        onToggleHidden={(h) => handleTogglePostHidden(p.id, h)}
                        onDelete={() => handleDeletePost(p.id)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
