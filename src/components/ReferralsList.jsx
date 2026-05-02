import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { BLUE, TEAL, NAVY, AMBER, avColor, initials } from './shared';
import { useT } from '../i18n';

const INITIAL_VISIBLE = 5;

/**
 * Locale-aware relative time using Intl.RelativeTimeFormat.
 * Falls back to localized short date for older entries (>= 7 days).
 */
function formatRelativeTime(iso, lang) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const ms = Date.now() - then;
  const sec = Math.max(0, Math.floor(ms / 1000));
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  if (sec < 60) return rtf.format(0, 'second');
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, 'minute');
  const hr = Math.floor(min / 60);
  if (hr < 24) return rtf.format(-hr, 'hour');
  const day = Math.floor(hr / 24);
  if (day < 7) return rtf.format(-day, 'day');
  try {
    const localeTag = lang === 'he' ? 'he-IL' : 'en-US';
    return new Date(iso).toLocaleDateString(localeTag, {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export default function ReferralsList() {
  const { t, lang } = useT();
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
        <h3 style={titleStyle}>{t('members.referrals.title')}</h3>
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
            {t('members.referrals.count', { count })}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: '#888', padding: '6px 0' }}>{t('common.loading')}</div>
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
          {t('members.referrals.empty')}
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
              {t('members.referrals.unlocked')}
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
                  {formatRelativeTime(r.createdAt, lang)}
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
              {t('members.referrals.showMore', { count: count - INITIAL_VISIBLE })}
            </button>
          )}
        </>
      )}
    </div>
  );
}
