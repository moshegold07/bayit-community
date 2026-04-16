import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE } from '../components/shared';
import { logActivity } from '../utils/activityLog';
import PollCard from '../components/PollCard';
import { filterHidden } from '../components/AdminContentAction';

const EMPTY_FORM = {
  question: '',
  options: ['', ''],
  multiSelect: false,
  expiresAt: '',
};

export default function Polls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs('polls', [], {
          field: 'createdAt',
          direction: 'DESCENDING',
        });
        if (!cancelled) setPolls(docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // Failed to load polls
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = user?.role === 'admin';
  const visiblePolls = filterHidden(polls, isAdmin);

  const filtered = visiblePolls.filter((p) => {
    if (!search) return true;
    return (p.question || '').toLowerCase().includes(search.toLowerCase());
  });

  function handleQuestionChange(value) {
    setForm((prev) => ({ ...prev, question: value }));
    setError('');
  }

  function handleOptionChange(index, value) {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
    setError('');
  }

  function addOption() {
    if (form.options.length >= 8) return;
    setForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  }

  function removeOption(index) {
    if (form.options.length <= 2) return;
    setForm((prev) => {
      const options = prev.options.filter((_, i) => i !== index);
      return { ...prev, options };
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');

    const q = form.question.trim();
    if (!q) {
      setError('נא להזין שאלה');
      return;
    }
    if (q.length > 200) {
      setError('שאלה עד 200 תווים');
      return;
    }

    const cleanOptions = form.options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (cleanOptions.length < 2) {
      setError('נא להזין לפחות 2 אפשרויות');
      return;
    }

    const uniqueOptions = new Set(cleanOptions);
    if (uniqueOptions.size !== cleanOptions.length) {
      setError('אפשרויות חייבות להיות ייחודיות');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const createdByName = ((user.first || '') + ' ' + (user.last || '')).trim();
      const newPoll = {
        question: q,
        options: cleanOptions,
        votes: {},
        multiSelect: form.multiSelect,
        createdBy: user.uid,
        createdByName,
        createdAt: now,
        expiresAt: form.expiresAt || '',
      };
      const id = await db.addDoc('polls', newPoll);
      logActivity({
        type: 'poll_created',
        actorName: createdByName,
        title: q,
        link: '/polls',
      });
      setPolls((prev) => [{ id, ...newPoll }, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      console.error('Poll create error:', err);
      setError('שגיאה ביצירת הסקר: ' + (err.message || 'נסה שוב'));
    }
    setSaving(false);
  }

  async function handleVote(pollId, optionIndices) {
    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;

    // Check if expired
    if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) return;

    // Check if already voted
    const alreadyVoted = Object.values(poll.votes || {}).some(
      (uids) => Array.isArray(uids) && uids.includes(user.uid),
    );
    if (alreadyVoted) return;

    // Normalize to array (single select passes one index, multi passes array)
    const indices = Array.isArray(optionIndices) ? optionIndices : [optionIndices];

    // Build updated votes in one pass
    const votes = { ...(poll.votes || {}) };
    for (const idx of indices) {
      const key = String(idx);
      const current = Array.isArray(votes[key]) ? [...votes[key]] : [];
      current.push(user.uid);
      votes[key] = current;
    }

    try {
      await db.updateDoc('polls', pollId, { votes });
      setPolls((prev) => prev.map((p) => (p.id === pollId ? { ...p, votes } : p)));
    } catch (err) {
      console.error('Vote error:', err);
    }
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
        <h2 style={{ margin: 0, fontSize: 22, color: '#222' }}>סקרים</h2>
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
          {showForm ? 'ביטול' : 'סקר חדש +'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{ ...s.card, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 12, color: '#333' }}>
            סקר חדש
          </div>

          <div style={s.fieldRow}>
            <label style={s.label}>שאלה *</label>
            <input
              style={s.input}
              dir="rtl"
              value={form.question}
              onChange={(e) => handleQuestionChange(e.target.value)}
              maxLength={200}
              placeholder="מה תרצו לשאול?"
            />
          </div>

          <div style={s.fieldRow}>
            <label style={s.label}>אפשרויות (2-8)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    style={{ ...s.input, flex: 1 }}
                    dir="rtl"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`אפשרות ${i + 1}`}
                    maxLength={100}
                  />
                  {form.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      style={{
                        width: 32,
                        height: 32,
                        border: '1px solid #D5D0C8',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#A32D2D',
                        fontSize: 16,
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {form.options.length < 8 && (
              <button
                type="button"
                onClick={addOption}
                style={{
                  marginTop: 8,
                  padding: '6px 14px',
                  border: '1px solid #D5D0C8',
                  borderRadius: 8,
                  background: '#fff',
                  color: '#555',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                + הוסף אפשרות
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 20,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                color: '#444',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.multiSelect}
                onChange={(e) => setForm((prev) => ({ ...prev, multiSelect: e.target.checked }))}
              />
              בחירה מרובה
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#666' }}>תאריך סיום</label>
              <input
                type="date"
                style={{ ...s.input, width: 'auto' }}
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
          </div>

          {error && <div style={s.err}>{error}</div>}

          <button
            type="submit"
            disabled={saving}
            style={{ ...s.btnPrimary, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'יוצר...' : 'צור סקר'}
          </button>
        </form>
      )}

      {/* Search */}
      <input
        style={{ ...s.input, marginBottom: 12 }}
        placeholder="חיפוש סקרים..."
        dir="rtl"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #E8E5DE',
            borderRadius: 8,
            padding: '10px 16px',
            flex: 1,
          }}
        >
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>סה&quot;כ סקרים</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: BLUE }}>{visiblePolls.length}</div>
        </div>
      </div>

      {/* Poll List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>טוען...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem 0', fontSize: 15 }}>
          {search ? 'לא נמצאו סקרים' : 'אין סקרים עדיין'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={user?.uid}
              onVote={handleVote}
              onToggleHidden={(h) => setPolls((prev) => prev.map((p) => (p.id === poll.id ? { ...p, hidden: h } : p)))}
              onDelete={() => setPolls((prev) => prev.filter((p) => p.id !== poll.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
