import { useState } from 'react';
import { useT } from '../i18n';
import { BLUE, NAVY } from './shared';

// Brand colors for share buttons
const WA_GREEN = '#25D366';
const X_BLACK = '#000000';
const FB_BLUE = '#1877F2';
const LI_BLUE = '#0A66C2';
const IG_GRADIENT = 'linear-gradient(45deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)';

function formatRelativeTime(iso, lang) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const ms = Date.now() - then;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return rtf.format(0, 'second');
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, 'minute');
  const hr = Math.floor(min / 60);
  if (hr < 24) return rtf.format(-hr, 'hour');
  const days = Math.floor(hr / 24);
  if (days < 7) return rtf.format(-days, 'day');
  // Fall back to a short date
  try {
    return new Date(iso).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export default function JourneyPostCard({ post, currentUser, onDelete }) {
  const { t, lang } = useT();
  const [copyToast, setCopyToast] = useState(false);

  if (!post) return null;

  const canDelete =
    !!currentUser && (currentUser.uid === post.authorId || currentUser.role === 'admin');

  const baseText = (post.text || '').trim();
  const truncated = baseText.length > 120 ? baseText.slice(0, 120) + '…' : baseText;
  const shareText = `${truncated}\n\n${t('content.journey.card.shareSuffix')}`;
  const shareUrl = `https://bayit-community.com/journey${
    currentUser?.uid ? `?ref=${currentUser.uid}` : ''
  }`;

  function handleDelete() {
    if (!canDelete) return;
    if (!window.confirm(t('content.journey.card.deleteConfirm'))) return;
    onDelete?.(post.id);
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText,
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function shareFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function shareLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl,
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function shareInstagram() {
    const text = `${shareText} ${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {
      // clipboard may be unavailable — still open Instagram
    }
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  }

  const shareBtn = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    padding: 0,
  };

  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        border: '1px solid #E8E5DE',
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: '0 1px 2px rgba(28,38,56,0.04)',
      }}
    >
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          aria-label={t('content.journey.card.deleteAria')}
          title={t('content.journey.card.deleteTitle')}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: '#888',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      )}

      {/* Top row: author + time */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 8,
          paddingLeft: canDelete ? 28 : 0,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>
          {post.authorName || t('content.journey.card.anonymous')}
        </span>
        <span style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>
          {formatRelativeTime(post.createdAt, lang)}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          color: '#333',
          marginBottom: 12,
          wordBreak: 'break-word',
        }}
      >
        {post.text}
      </div>

      {/* Share row */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          paddingTop: 10,
          borderTop: `1px solid ${BLUE}1A`,
        }}
      >
        <span style={{ fontSize: 11, color: '#888', marginLeft: 2 }}>
          {t('content.journey.card.shareLabel')}
        </span>

        <button
          type="button"
          onClick={shareWhatsApp}
          aria-label={t('content.journey.card.shareWhatsApp')}
          title="WhatsApp"
          style={{ ...shareBtn, background: WA_GREEN }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 21.785h-.003a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.453 3.488z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={shareTwitter}
          aria-label={t('content.journey.card.shareTwitter')}
          title="X / Twitter"
          style={{ ...shareBtn, background: X_BLACK }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={shareFacebook}
          aria-label={t('content.journey.card.shareFacebook')}
          title="Facebook"
          style={{ ...shareBtn, background: FB_BLUE }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={shareLinkedIn}
          aria-label={t('content.journey.card.shareLinkedIn')}
          title="LinkedIn"
          style={{ ...shareBtn, background: LI_BLUE }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={shareInstagram}
          aria-label={t('content.journey.card.shareInstagram')}
          title="Instagram"
          style={{ ...shareBtn, background: IG_GRADIENT }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
          </svg>
        </button>

        {copyToast && (
          <span
            style={{
              fontSize: 11,
              color: NAVY,
              background: '#fff',
              border: `1px solid ${BLUE}55`,
              padding: '3px 8px',
              borderRadius: 12,
              marginRight: 'auto',
            }}
          >
            {t('content.journey.card.copyToast')}
          </span>
        )}
      </div>
    </div>
  );
}
