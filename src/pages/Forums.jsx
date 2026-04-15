import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE } from '../components/shared';

const AV = ['#2563EB', '#1E40AF', '#059669', '#7A4F9A', '#B05020'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}

export default function Forums() {
  const { user } = useAuth();
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs('forums', [], {
          field: 'lastPostAt',
          direction: 'DESCENDING',
        });
        if (!cancelled) setForums(docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // Failed to load forums
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const t = title.trim();
    if (!t) {
      setError('יש להזין כותרת');
      return;
    }
    if (t.length > 100) {
      setError('כותרת עד 100 תווים');
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const data = {
        title: t,
        description: desc.trim(),
        createdBy: user.uid,
        createdByName: (user.first || '') + ' ' + (user.last || ''),
        createdAt: now,
        lastPostAt: now,
        postCount: 0,
      };
      const id = await db.addDoc('forums', data);
      setForums((prev) => [{ id, ...data }, ...prev]);
      setTitle('');
      setDesc('');
      setShowForm(false);
    } catch {
      setError('שגיאה ביצירת הנושא');
    }
    setSubmitting(false);
  }

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
        <h2 style={{ margin: 0, fontSize: 22, color: '#222' }}>פורומים</h2>
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
          {showForm ? 'ביטול' : '+ נושא חדש'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 12, color: '#333' }}>
            נושא חדש
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>כותרת *</label>
            <input
              style={s.input}
              dir="rtl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="שם הנושא"
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={s.label}>תיאור</label>
            <textarea
              style={s.textarea}
              dir="rtl"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="תיאור קצר של הנושא"
            />
          </div>
          {error && <div style={s.err}>{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{ ...s.btnPrimary, opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'יוצר...' : 'צור נושא'}
          </button>
        </form>
      )}

      <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{forums.length} נושאים</div>

      {forums.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem 0', fontSize: 15 }}>
          אין נושאים בפורום עדיין
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {forums.map((f) => (
            <Link
              key={f.id}
              to={`/forums/${f.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{ ...s.card, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = BLUE)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: avColor(f.createdBy || f.id),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {(f.createdByName || '')
                      .split(' ')
                      .map((p) => p[0] || '')
                      .join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 16, color: '#222' }}>{f.title}</div>
                    {f.description && (
                      <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                        {f.description.length > 100
                          ? f.description.slice(0, 100) + '...'
                          : f.description}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 500, color: BLUE }}>
                      {f.postCount || 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>פוסטים</div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: '#aaa',
                  }}
                >
                  <span>נוצר ע&quot;י {f.createdByName}</span>
                  <span>
                    {f.lastPostAt ? new Date(f.lastPostAt).toLocaleDateString('he-IL') : ''}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
