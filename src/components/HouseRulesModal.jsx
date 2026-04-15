import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { BLUE } from './shared';

export default function HouseRulesModal({ onClose }) {
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await db.getDoc('settings', 'houseRules');
      if (snap.exists()) setRules(snap.data().text || '');
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '0.5px solid #e0e0da',
          padding: '1.5rem',
          width: '100%',
          maxWidth: 520,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '0.5px solid #eee',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE }} />
            <span style={{ fontWeight: 500, fontSize: 16 }}>חוקי הבית</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#888',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ color: '#888', fontSize: 14 }}>טוען...</div>
          ) : rules ? (
            <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#333' }}>
              {rules}
            </div>
          ) : (
            <div style={{ color: '#888', fontSize: 14 }}>לא הוגדרו חוקי בית עדיין.</div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '1rem',
            padding: '8px 20px',
            background: BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            alignSelf: 'flex-end',
          }}
        >
          סגור
        </button>
      </div>
    </div>
  );
}
