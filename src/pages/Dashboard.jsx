import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { s, BLUE, BLUE_LT, BLUE_DK, NAVY } from '../components/shared';
import VentureCard from '../components/VentureCard';
import ManifestoBanner from '../components/ManifestoBanner';

const TABS = [
  { key: 'distributed', label: 'השבוע להפצה' },
  { key: 'pending', label: 'מחכים בתור' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('distributed');
  // Cache per-tab so re-clicking is instant after first fetch.
  const [cache, setCache] = useState({ distributed: null, pending: null });
  const [loading, setLoading] = useState(false);
  // Tabs are hidden until the manifesto is dismissed (closed or shared).
  // Initial value reads localStorage synchronously so first paint is correct.
  const [manifestoVisible, setManifestoVisible] = useState(() => {
    try {
      if (localStorage.getItem('bayit_manifesto_dismissed') === 'true') return false;
      if (localStorage.getItem('manifestoSeenVersion') !== null) return false;
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!manifestoVisible) return;
    if (cache[activeTab] !== null) return; // already fetched
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const docs = await db.getDocs('ventures', [
          { field: 'status', op: 'EQUAL', value: activeTab },
        ]);
        let list = docs.map((d) => ({ id: d.id, ...d.data() }));
        if (activeTab === 'pending') {
          list = list.sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
        }
        if (!cancelled) {
          setCache((prev) => ({ ...prev, [activeTab]: list }));
        }
      } catch {
        if (!cancelled) {
          setCache((prev) => ({ ...prev, [activeTab]: [] }));
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, cache, manifestoVisible]);

  const items = cache[activeTab];
  const isLoading = loading && items === null;

  if (manifestoVisible) {
    return (
      <div style={{ ...s.body, maxWidth: 900 }}>
        <ManifestoBanner onDismiss={() => setManifestoVisible(false)} />
      </div>
    );
  }

  return (
    <div style={{ ...s.body, maxWidth: 900 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          margin: '1rem 0',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={tabStyle(active)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>טוען...</div>
      ) : items && items.length === 0 ? (
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
          {activeTab === 'distributed'
            ? 'השבוע אין מיזם פעיל בהפצה — חזרו בקרוב!'
            : 'עדיין אין מיזמים בתור. תהיו הראשונים להוסיף!'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(items || []).map((v) => (
            <VentureCard key={v.id} venture={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function tabStyle(active) {
  return {
    padding: '7px 18px',
    borderRadius: 18,
    fontSize: 14,
    cursor: 'pointer',
    border: active ? `1.5px solid ${BLUE}` : '0.5px solid #ccc',
    background: active ? BLUE_LT : '#fff',
    color: active ? BLUE_DK : NAVY,
    fontWeight: active ? 600 : 400,
    transition: 'background 0.15s, border-color 0.15s',
  };
}
