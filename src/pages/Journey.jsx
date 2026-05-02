import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../i18n';
import { s, BLUE, NAVY } from '../components/shared';
import JourneyPostCard from '../components/JourneyPostCard';
import JourneyComposer from '../components/JourneyComposer';

export default function Journey() {
  const { t } = useT();
  const { user, isPending } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs('journeyPosts', [], {
          field: 'createdAt',
          direction: 'DESCENDING',
        });
        if (!cancelled) {
          const mapped = docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 50);
          setPosts(mapped);
        }
      } catch {
        // load failed — empty state
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(postId) {
    try {
      await db.deleteDoc('journeyPosts', postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      window.alert(t('content.journey.feed.deleteFailed'));
    }
  }

  function handlePosted(newPost) {
    setPosts((prev) => [newPost, ...prev]);
    setComposerOpen(false);
  }

  return (
    <div style={{ ...s.body, maxWidth: 700 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: NAVY }}>
            {t('content.journey.feed.title')}
          </h1>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            {t('content.journey.feed.subtitle')}
          </div>
        </div>
        {!isPending && user && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            style={{
              padding: '8px 18px',
              background: BLUE,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t('content.journey.feed.shareUpdate')}
          </button>
        )}
      </div>

      {composerOpen && (
        <JourneyComposer onPosted={handlePosted} onClose={() => setComposerOpen(false)} />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
          {t('common.loading')}
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#888',
            background: '#fff',
            border: '1px dashed #D5D0C8',
            borderRadius: 12,
          }}
        >
          {t('content.journey.feed.empty')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {posts.map((p) => (
            <JourneyPostCard key={p.id} post={p} currentUser={user} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
