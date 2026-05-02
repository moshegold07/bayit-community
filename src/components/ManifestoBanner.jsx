import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { BLUE, BLUE_LT, NAVY } from './shared';

const STORAGE_KEY = 'bayit_manifesto_dismissed';
const LEGACY_KEY = 'manifestoSeenVersion';

// Brand colors
const WA_GREEN = '#25D366';
const X_BLACK = '#000000';
const FB_BLUE = '#1877F2';
const IG_GRADIENT = 'linear-gradient(45deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)';

export default function ManifestoBanner({ onDismiss }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await db.getDoc('settings', 'manifesto');
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        if (!d?.enabled || !d?.body) return;
        // Once-only dismissal: if user has dismissed (new key) OR seen any prior
        // version (legacy key), keep it hidden.
        if (
          localStorage.getItem(STORAGE_KEY) === 'true' ||
          localStorage.getItem(LEGACY_KEY) !== null
        ) {
          onDismiss?.();
          return;
        }
        setData(d);
        setOpen(true);
      } catch {
        // silent — banner is non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, onDismiss]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
    onDismiss?.();
  }

  if (authLoading || !user || !open || !data) return null;

  const refUrl = `${window.location.origin}/r/${user.uid}`;
  const baseText = (data.body || '').trim();
  const shareText = baseText
    ? baseText.slice(0, 120) + (baseText.length > 120 ? '…' : '')
    : data.title || 'המניפסט שלנו';

  function dismissAfterShare() {
    localStorage.setItem(STORAGE_KEY, 'true');
    // Slight delay so the share popup opens before the banner unmounts.
    setTimeout(() => {
      setOpen(false);
      onDismiss?.();
    }, 300);
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + refUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    dismissAfterShare();
  }

  function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText,
    )}&url=${encodeURIComponent(refUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    dismissAfterShare();
  }

  function shareFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    dismissAfterShare();
  }

  async function shareInstagram() {
    const text = `${shareText} ${refUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {
      // clipboard may not be available — still open Instagram
    }
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    // Wait a bit longer so the toast is visible before dismissing.
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, 'true');
      setOpen(false);
      onDismiss?.();
    }, 1800);
  }

  const shareBtn = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  };

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '1rem auto 0',
        padding: '0 1.5rem',
        direction: 'rtl',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: BLUE_LT,
          border: `1px solid ${BLUE}33`,
          borderRadius: 12,
          padding: '1.25rem 1.25rem 1rem',
          boxShadow: '0 1px 4px rgba(28,38,56,0.06)',
        }}
      >
        {/* X close button — top-right (RTL) */}
        <button
          onClick={dismiss}
          aria-label="סגור מניפסט"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: NAVY,
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
            paddingLeft: 32,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE }} />
          <span style={{ fontWeight: 600, fontSize: 16, color: NAVY }}>
            {data.title || 'המניפסט שלנו'}
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            color: '#333',
            marginBottom: 14,
          }}
        >
          {data.body}
        </div>

        {/* Share row */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            paddingTop: 10,
            borderTop: `1px solid ${BLUE}22`,
          }}
        >
          <span style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>שתפו:</span>

          <button
            type="button"
            onClick={shareWhatsApp}
            aria-label="שתף בוואטסאפ"
            title="WhatsApp"
            style={{ ...shareBtn, background: WA_GREEN }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 21.785h-.003a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.453 3.488z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={shareTwitter}
            aria-label="שתף בטוויטר"
            title="X / Twitter"
            style={{ ...shareBtn, background: X_BLACK }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={shareFacebook}
            aria-label="שתף בפייסבוק"
            title="Facebook"
            style={{ ...shareBtn, background: FB_BLUE }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={shareInstagram}
            aria-label="שתף באינסטגרם"
            title="Instagram"
            style={{ ...shareBtn, background: IG_GRADIENT }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
          </button>

          {copyToast && (
            <span
              style={{
                fontSize: 12,
                color: NAVY,
                background: '#fff',
                border: `1px solid ${BLUE}55`,
                padding: '4px 10px',
                borderRadius: 14,
                marginRight: 'auto',
              }}
            >
              הקישור הועתק! הדבק בסטורי או בפוסט
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
