import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { TEAL, AMBER } from './shared';

export default function EndorsementSection({ targetUid, targetName, currentUserId, currentUserName }) {
  const [endorsements, setEndorsements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchEndorsements() {
    try {
      const docs = await db.getDocs('endorsements', [
        { field: 'toUid', op: 'EQUAL', value: targetUid },
      ]);
      setEndorsements(docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setEndorsements([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (targetUid) fetchEndorsements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUid]);

  const alreadyEndorsed = endorsements.some((e) => e.fromUid === currentUserId);
  const isSelf = currentUserId === targetUid;

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 300) return;
    setSubmitting(true);
    try {
      await db.addDoc('endorsements', {
        fromUid: currentUserId,
        fromName: currentUserName,
        toUid: targetUid,
        text: trimmed,
        createdAt: new Date().toISOString(),
      });
      setText('');
      setShowForm(false);
      await fetchEndorsements();
    } catch {
      // silent fail
    }
    setSubmitting(false);
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('he-IL');
    } catch {
      return '';
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '0.75rem 0', color: '#888', fontSize: 13, textAlign: 'center' }}>
        טוען המלצות...
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', marginTop: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#333' }}>
        המלצות{endorsements.length > 0 ? ` (${endorsements.length})` : ''}
      </div>

      {endorsements.length === 0 && (
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>
          אין המלצות עדיין עבור {targetName}
        </div>
      )}

      {endorsements.map((e) => (
        <div
          key={e.id}
          style={{
            padding: '8px 10px',
            background: '#f9f9f7',
            borderRadius: 8,
            marginBottom: 6,
            borderRight: `3px solid ${TEAL}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{e.fromName}</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>{formatDate(e.createdAt)}</span>
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {e.text}
          </div>
        </div>
      ))}

      {!isSelf && !alreadyEndorsed && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            marginTop: 6,
            padding: '7px 16px',
            background: TEAL,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          כתוב המלצה
        </button>
      )}

      {!isSelf && alreadyEndorsed && (
        <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>כבר כתבת המלצה</div>
      )}

      {showForm && (
        <div style={{ marginTop: 8 }}>
          <textarea
            dir="rtl"
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= 300) setText(e.target.value);
            }}
            placeholder={`כתוב המלצה עבור ${targetName}...`}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #D5D0C8',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'sans-serif',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: 70,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 11, color: text.length > 280 ? AMBER : '#aaa' }}>
              {text.length}/300
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => {
                  setShowForm(false);
                  setText('');
                }}
                style={{
                  padding: '6px 14px',
                  background: '#eee',
                  color: '#555',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                ביטול
              </button>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                style={{
                  padding: '6px 14px',
                  background: !text.trim() || submitting ? '#ccc' : TEAL,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: !text.trim() || submitting ? 'default' : 'pointer',
                }}
              >
                {submitting ? 'שולח...' : 'שלח המלצה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
