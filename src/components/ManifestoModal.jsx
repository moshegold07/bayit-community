import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { BLUE } from './shared';

const STORAGE_KEY = 'manifestoSeenVersion';

export default function ManifestoModal() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await db.getDoc('settings', 'manifesto');
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        if (!d?.enabled || !d?.body) return;
        const version = String(d.version ?? 1);
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen === version) return;
        setData({ ...d, version });
        setOpen(true);
      } catch {
        // silent — popup is non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  function dismiss() {
    if (data?.version) localStorage.setItem(STORAGE_KEY, data.version);
    setOpen(false);
  }

  if (!open || !data) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 250,
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
          border: '1px solid #E8E5DE',
          padding: '1.5rem',
          width: '100%',
          maxWidth: 560,
          maxHeight: '85vh',
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
            <span style={{ fontWeight: 500, fontSize: 16 }}>{data.title || 'המניפסט שלנו'}</span>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#333' }}>
            {data.body}
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{
            marginTop: '1rem',
            padding: '10px 20px',
            background: BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            alignSelf: 'flex-end',
            fontWeight: 500,
          }}
        >
          הבנתי
        </button>
      </div>
    </div>
  );
}
