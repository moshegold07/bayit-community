import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { BLUE, TEAL, NAVY, AMBER, avColor, initials } from './shared';

const INITIAL_VISIBLE = 5;

function formatRelativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return 'עכשיו';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `לפני ${diffHr} שעות`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return 'אתמול';
  if (diffDay < 7) return `לפני ${diffDay} ימים`;
  try {
    return new Date(iso).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export default function ReferralsList() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    (async () => {
      try {
        const docs = await db.getDocs('users', [
          { field: 'referredBy', op: 'EQUAL', value: user.uid },
        ]);
        const arr = docs.map((d) => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime() || 0;
          const tb = new Date(b.createdAt || 0).getTime() || 0;
          return tb - ta;
        });
        if (!cancelled) setReferrals(arr);
      } catch (_e) {
        // Field index may not exist yet — silently fall back to empty.
        if (!cancelled) setReferrals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  if (!user) return null;

  const cardStyle = {
    background: '#fff',
    border: '1px solid #E8E5DE',
    borderRadius: 12,
    padding: '14px 18px',
  };

  const titleStyle = {
    fontSize: 15,
    fontWeight: 600,
    color: NAVY,
    margin: 0,
  };

  const count = referrals.length;
  const visible = showAll ? referrals : referrals.slice(0, INITIAL_VISIBLE);
  const referredCount = Math.max(0, Number(user?.referredCount) || count);
  const unlocked = referredCount >= 10;

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 10,
        }}
      >
        <h3 style={titleStyle}>חברים שהצטרפו דרכך</h3>
        {count > 0 && (
          <span
            style={{
              fontSize: 11,
              padding: '2px 9px',
              borderRadius: 20,
              background: '#EDF4FB',
              color: BLUE,
              fontWeight: 500,
            }}
          >
            {count} חברים
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: '#888', padding: '6px 0' }}>טוען...</div>
      ) : count === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: '#888',
            lineHeight: 1.6,
            background: '#F9F8F5',
            border: '1px dashed #E0DCD4',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          אין חברים שהצטרפו דרך הקישור שלך עדיין. שתפו את הקישור!
        </div>
      ) : (
        <>
          {unlocked && (
            <div
              style={{
                fontSize: 12,
                color: '#7A4A05',
                background: '#FFF8EB',
                border: `1px solid ${AMBER}55`,
                borderRadius: 8,
                padding: '6px 10px',
                marginBottom: 10,
              }}
            >
              🎉 פתחת אפשרות שיתוף מיזם!
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                  borderBottom: '0.5px solid #f0eee9',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: avColor(r.phone || r.id),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 500,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {initials(r.first, r.last)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: NAVY,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {(r.first || '').trim()} {(r.last || '').trim()}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: '#999',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatRelativeTime(r.createdAt)}
                </span>
              </div>
            ))}
          </div>
          {count > INITIAL_VISIBLE && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                marginTop: 10,
                background: 'transparent',
                border: 'none',
                color: TEAL,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              הצג עוד ({count - INITIAL_VISIBLE})
            </button>
          )}
        </>
      )}
    </div>
  );
}
