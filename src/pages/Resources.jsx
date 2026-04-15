import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { s, BLUE } from '../components/shared';
import ResourceCard from '../components/ResourceCard';

const CATEGORIES = {
  article: 'מאמר',
  tool: 'כלי',
  template: 'תבנית',
  video: 'סרטון',
  book: 'ספר',
  course: 'קורס',
  other: 'אחר',
};

const EMPTY_FORM = {
  title: '',
  url: '',
  description: '',
  category: 'article',
  tagsText: '',
};

export default function Resources() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs('resources');
        if (!cancelled) {
          setResources(docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        // Failed to load resources
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...resources];

    if (catFilter) {
      list = list.filter((r) => r.category === catFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (sortBy === 'popular') {
      list.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
    } else {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    return list;
  }, [resources, catFilter, search, sortBy]);

  const handleUpvote = useCallback(
    async (resourceId) => {
      if (!user) return;
      const idx = resources.findIndex((r) => r.id === resourceId);
      if (idx === -1) return;

      try {
        const snap = await db.getDoc('resources', resourceId);
        if (!snap.exists()) return;
        const data = snap.data();
        const upvotes = data.upvotes || [];
        const uid = user.uid;
        let newUpvotes;
        let newCount;

        if (upvotes.includes(uid)) {
          newUpvotes = upvotes.filter((id) => id !== uid);
          newCount = Math.max((data.upvoteCount || 0) - 1, 0);
        } else {
          newUpvotes = [...upvotes, uid];
          newCount = (data.upvoteCount || 0) + 1;
        }

        await db.updateDoc('resources', resourceId, {
          upvotes: newUpvotes,
          upvoteCount: newCount,
        });

        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId ? { ...r, upvotes: newUpvotes, upvoteCount: newCount } : r,
          ),
        );
      } catch (err) {
        // Upvote failed
      }
    },
    [user, resources],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const title = form.title.trim();
    const url = form.url.trim();
    const description = form.description.trim();
    const category = form.category;
    const tags = form.tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (!title) {
      setError('יש להזין כותרת');
      return;
    }
    if (title.length > 100) {
      setError('כותרת עד 100 תווים');
      return;
    }
    if (!url) {
      setError('יש להזין קישור');
      return;
    }
    if (description.length > 500) {
      setError('תיאור עד 500 תווים');
      return;
    }

    setSubmitting(true);
    try {
      const newResource = {
        title,
        url,
        description,
        category,
        tags,
        sharedBy: user.uid,
        sharedByName: (user.first || '') + ' ' + (user.last || ''),
        upvotes: [],
        upvoteCount: 0,
        createdAt: new Date().toISOString(),
      };
      const id = await db.addDoc('resources', newResource);
      setResources((prev) => [{ id, ...newResource }, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      // Submit failed
      setError('שגיאה בשיתוף התוכן');
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div style={{ ...s.body, textAlign: 'center', padding: '3rem', color: '#888' }}>טוען...</div>
    );
  }

  return (
    <div style={s.body}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, color: '#222' }}>תוכן</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            ...s.btnPrimary,
            width: 'auto',
            padding: '8px 18px',
            marginTop: 0,
            fontSize: 14,
          }}
        >
          {showForm ? 'ביטול' : 'שיתוף תוכן חדש'}
        </button>
      </div>

      {/* Share form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 12, color: '#333' }}>
            שיתוף תוכן חדש
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>כותרת *</label>
            <input
              style={s.input}
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              maxLength={100}
              placeholder="כותרת"
              dir="rtl"
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>קישור *</label>
            <input
              style={{ ...s.input, direction: 'ltr', textAlign: 'left' }}
              value={form.url}
              onChange={(e) => setField('url', e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>תיאור</label>
            <textarea
              style={s.textarea}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="תיאור קצר של המשאב"
              dir="rtl"
            />
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}
          >
            <div>
              <label style={s.label}>קטגוריה</label>
              <select
                style={s.input}
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                dir="rtl"
              >
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={s.label}>תגיות (עד 5, מופרדות בפסיק)</label>
              <input
                style={s.input}
                value={form.tagsText}
                onChange={(e) => setField('tagsText', e.target.value)}
                placeholder="יזמות, שיווק, AI"
                dir="rtl"
              />
            </div>
          </div>

          {error && <div style={s.err}>{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...s.btnPrimary,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'שולח...' : 'שתף'}
          </button>
        </form>
      )}

      {/* Search + filter bar */}
      <div style={{ ...s.card, marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            style={{ ...s.input, flex: 1, minWidth: 160 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש תוכן..."
            dir="rtl"
          />
          <select
            style={{ ...s.input, width: 'auto', minWidth: 120 }}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            dir="rtl"
          >
            <option value="">כל הקטגוריות</option>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #ddd',
            }}
          >
            <button
              onClick={() => setSortBy('popular')}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                background: sortBy === 'popular' ? BLUE : '#fff',
                color: sortBy === 'popular' ? '#fff' : '#666',
                fontWeight: sortBy === 'popular' ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              פופולריים
            </button>
            <button
              onClick={() => setSortBy('newest')}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                border: 'none',
                borderRight: '1px solid #ddd',
                cursor: 'pointer',
                background: sortBy === 'newest' ? BLUE : '#fff',
                color: sortBy === 'newest' ? '#fff' : '#666',
                fontWeight: sortBy === 'newest' ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              חדשים
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
        {filtered.length} פריטי תוכן
        {catFilter ? ` ב${CATEGORIES[catFilter]}` : ''}
        {search.trim() ? ` - חיפוש: "${search.trim()}"` : ''}
      </div>

      {/* Resource list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem 0', fontSize: 15 }}>
          אין תוכן כרגע
        </div>
      ) : (
        filtered.map((r) => (
          <ResourceCard key={r.id} resource={r} currentUserId={user?.uid} onUpvote={handleUpvote} />
        ))
      )}
    </div>
  );
}
