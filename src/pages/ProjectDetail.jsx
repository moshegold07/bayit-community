import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE, BLUE_LT, BLUE_DK } from '../components/shared';
import AdminContentAction, {
  HiddenBadge,
  hiddenItemStyle,
  filterHidden,
} from '../components/AdminContentAction';
import CategoryDisplay from '../components/CategoryDisplay';

const STATUS_MAP = {
  looking: { label: 'מחפש שותפים', color: '#EF9F27', bg: '#FFF8EC' },
  active: { label: 'פעיל', color: '#1A8080', bg: '#E8F6F6' },
  completed: { label: 'הושלם', color: '#888', bg: '#f0f0f0' },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPending } = useAuth();
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const snap = await db.getDoc('projects', id);
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setProject({ id: snap.id, ...snap.data() });

        const commentDocs = await db.getDocs('projects/' + id + '/comments', [], {
          field: 'createdAt',
          direction: 'ASCENDING',
        });
        setComments(commentDocs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        // Failed to load project
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const isMember = project?.members?.includes(user?.uid);
  const isCreator = project?.createdBy === user?.uid;
  const isAdmin = user?.role === 'admin';
  const status = STATUS_MAP[project?.status] || STATUS_MAP.looking;
  const visibleComments = filterHidden(comments, isAdmin);

  async function handleJoin() {
    if (!project || joining) return;
    setJoining(true);
    try {
      const freshSnap = await db.getDoc('projects', id);
      const freshData = freshSnap.data();
      const members = freshData.members || [];
      if (!members.includes(user.uid)) {
        members.push(user.uid);
        await db.updateDoc('projects', id, {
          members,
          memberCount: members.length,
          updatedAt: new Date().toISOString(),
        });
      }
      setProject({ ...freshData, id: project.id, members, memberCount: members.length });
    } catch (err) {
      // Failed to join project
    }
    setJoining(false);
  }

  async function handleLeave() {
    if (!project || joining) return;
    setJoining(true);
    try {
      const freshSnap = await db.getDoc('projects', id);
      const freshData = freshSnap.data();
      const members = (freshData.members || []).filter((uid) => uid !== user.uid);
      await db.updateDoc('projects', id, {
        members,
        memberCount: members.length,
        updatedAt: new Date().toISOString(),
      });
      setProject({ ...freshData, id: project.id, members, memberCount: members.length });
    } catch (err) {
      // Failed to leave project
    }
    setJoining(false);
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setCommentError('');
    setSubmitting(true);
    try {
      const newId = await db.addDoc('projects/' + id + '/comments', {
        text: commentText.trim(),
        authorId: user.uid,
        authorName: user.first + ' ' + user.last,
        createdAt: new Date().toISOString(),
      });
      setComments([
        ...comments,
        {
          id: newId,
          text: commentText.trim(),
          authorId: user.uid,
          authorName: user.first + ' ' + user.last,
          createdAt: new Date().toISOString(),
        },
      ]);
      setCommentText('');
    } catch (err) {
      console.error('Comment error:', err);
      setCommentError('שגיאה בהוספת תגובה: ' + (err.message || 'נסה שוב'));
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div style={s.body}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>טוען...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={s.body}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>הפרויקט לא נמצא</div>
        <button
          onClick={() => navigate('/projects')}
          style={{
            ...s.btnPrimary,
            maxWidth: 200,
            margin: '0 auto',
            display: 'block',
          }}
        >
          חזרה לפרויקטים
        </button>
      </div>
    );
  }

  return (
    <div style={s.body}>
      <button
        onClick={() => navigate('/projects')}
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
        → חזרה לפרויקטים
      </button>

      <div style={{ ...s.card, ...hiddenItemStyle(project.hidden) }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <h1
            style={{
              fontSize: 22,
              fontWeight: 500,
              margin: 0,
              color: '#222',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {project.title}
            {project.hidden && <HiddenBadge />}
          </h1>
          <span
            style={{
              fontSize: 12,
              padding: '3px 12px',
              borderRadius: 20,
              background: status.bg,
              color: status.color,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {status.label}
          </span>
        </div>

        {project.categories?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <CategoryDisplay categories={project.categories} size="md" />
          </div>
        )}

        <div
          style={{
            fontSize: 14,
            color: '#333',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            marginBottom: 16,
          }}
        >
          {project.description}
        </div>

        {project.lookingFor?.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              background: '#FFF8EC',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 }}>
              מחפשים
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {project.lookingFor.map((role) => (
                <span
                  key={role}
                  style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: '#fff',
                    border: '0.5px solid #EF9F27',
                    color: '#B07A1A',
                    fontWeight: 500,
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: 13,
            color: '#888',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          נוצר ע&quot;י{' '}
          <span style={{ color: '#444', fontWeight: 500 }}>{project.createdByName}</span>
          {project.createdAt && (
            <span> · {new Date(project.createdAt).toLocaleDateString('he-IL')}</span>
          )}
          <AdminContentAction
            collection="projects"
            docId={id}
            hidden={project.hidden}
            onToggleHidden={(h) => setProject((prev) => (prev ? { ...prev, hidden: h } : prev))}
            onDelete={() => navigate('/projects')}
          />
        </div>
      </div>

      {/* Members section */}
      <div style={{ ...s.card, marginTop: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>
            חברי צוות ({project.memberCount || project.members?.length || 0})
          </div>
          {!isPending && !isMember && (
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{
                padding: '6px 16px',
                background: BLUE,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: joining ? 0.6 : 1,
              }}
            >
              {joining ? '...' : 'הצטרף לפרויקט'}
            </button>
          )}
          {!isPending && isMember && !isCreator && (
            <button
              onClick={handleLeave}
              disabled={joining}
              style={{
                padding: '6px 16px',
                background: 'transparent',
                color: '#A32D2D',
                border: '0.5px solid #A32D2D',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                opacity: joining ? 0.6 : 1,
              }}
            >
              {joining ? '...' : 'עזיבת פרויקט'}
            </button>
          )}
        </div>

        {project.members?.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {project.members.map((uid) => (
              <span
                key={uid}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: uid === project.createdBy ? BLUE_LT : '#f4f4f2',
                  color: uid === project.createdBy ? BLUE_DK : '#555',
                  fontWeight: uid === project.createdBy ? 500 : 400,
                }}
              >
                {uid === user?.uid
                  ? user.first + ' ' + user.last
                  : uid === project.createdBy
                    ? project.createdByName
                    : 'חבר קהילה'}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#888' }}>אין חברי צוות עדיין</div>
        )}
      </div>

      {/* Comments section */}
      <div style={{ ...s.card, marginTop: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#222', marginBottom: 12 }}>
          תגובות ({visibleComments.length})
        </div>

        {visibleComments.length === 0 ? (
          <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
            אין תגובות עדיין. היה הראשון להגיב!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {visibleComments.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '10px 12px',
                  background: '#f9f9f7',
                  borderRadius: 8,
                  ...hiddenItemStyle(c.hidden),
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
                      {c.authorName}
                    </span>
                    {c.hidden && <HiddenBadge />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AdminContentAction
                      collection={'projects/' + id + '/comments'}
                      docId={c.id}
                      hidden={c.hidden}
                      onToggleHidden={(h) =>
                        setComments((prev) =>
                          prev.map((x) => (x.id === c.id ? { ...x, hidden: h } : x)),
                        )
                      }
                      onDelete={() => setComments((prev) => prev.filter((x) => x.id !== c.id))}
                    />
                    <span style={{ fontSize: 11, color: '#aaa' }}>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString('he-IL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                </div>
                <div
                  style={{ fontSize: 14, color: '#444', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                >
                  {c.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isPending && (
          <>
            {commentError && (
              <div style={{ ...s.err, marginBottom: 8, fontSize: 13 }}>{commentError}</div>
            )}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ ...s.input, flex: 1 }}
                dir="auto"
                placeholder="הוסף תגובה..."
                maxLength={1000}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                style={{
                  padding: '8px 16px',
                  background: BLUE,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: !commentText.trim() || submitting ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {submitting ? '...' : 'הוסף תגובה'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
