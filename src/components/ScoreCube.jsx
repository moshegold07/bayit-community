import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BLUE, BLUE_LT, BLUE_DK, AMBER, TEAL, NAVY, CREAM, GOLD } from './shared';

const MAX_SCORE = 10;
// 1 friend = 1 point. 10 friends unlocks venture sharing.
const FRIENDS_PER_POINT = 1;

function buildShareLink(uid) {
  return `https://bayit-community.com/?ref=${uid || ''}`;
}

async function copyToClipboard(text) {
  // Modern API requires a secure context (https or localhost)
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_e) {
      // fall through to legacy fallback
    }
  }
  // Legacy fallback for non-secure contexts (e.g. http preview)
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_e) {
    return false;
  }
}

export default function ScoreCube({ compact = false }) {
  const { user } = useAuth();
  const score = Math.max(0, Number(user?.score) || 0);
  const referredCount = Math.max(0, Number(user?.referredCount) || 0);
  const unlocked = score >= MAX_SCORE;
  const remainingPoints = Math.max(0, MAX_SCORE - score);
  const remainingFriends = remainingPoints * FRIENDS_PER_POINT;
  const progressPct = Math.min(100, (score / MAX_SCORE) * 100);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    if (!popoverOpen) return undefined;
    function onClick(e) {
      if (popRef.current && !popRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [popoverOpen]);

  if (!user) return null;

  const shareLink = buildShareLink(user.uid);

  async function handleCopy() {
    const ok = await copyToClipboard(shareLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  // ---------- COMPACT VARIANT ----------
  if (compact) {
    return (
      <div
        style={{ position: 'relative', display: 'inline-flex' }}
        ref={popRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <button
          type="button"
          onClick={() => setPopoverOpen((o) => !o)}
          aria-label="הניקוד שלי"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 9px',
            borderRadius: 14,
            background: unlocked
              ? 'linear-gradient(135deg, rgba(212,163,74,0.25) 0%, rgba(232,168,56,0.25) 100%)'
              : 'rgba(245,237,224,0.10)',
            border: `1px solid ${unlocked ? GOLD : 'rgba(212,163,74,0.35)'}`,
            color: unlocked ? GOLD : CREAM,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            lineHeight: 1.2,
            fontFamily: 'inherit',
          }}
        >
          <span aria-hidden="true">🏆</span>
          <span>{score}</span>
        </button>

        {hover && !popoverOpen && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              background: NAVY,
              color: CREAM,
              fontSize: 11,
              padding: '6px 9px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
              border: `1px solid ${GOLD}`,
              zIndex: 50,
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              direction: 'rtl',
            }}
          >
            {referredCount} חברים הצטרפו דרכך · {score}/{MAX_SCORE} נקודות
          </div>
        )}

        {popoverOpen && (
          <div
            style={{
              position: 'absolute',
              top: '115%',
              right: 0,
              background: '#fff',
              color: BLUE_DK,
              borderRadius: 10,
              padding: 14,
              width: 260,
              border: `1px solid ${GOLD}`,
              zIndex: 60,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              direction: 'rtl',
              textAlign: 'right',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 6 }}>
              הניקוד שלי
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: AMBER }}>{score}</span>
              <span style={{ fontSize: 12, color: '#888' }}>/ {MAX_SCORE}</span>
            </div>
            <div
              style={{
                height: 6,
                background: BLUE_LT,
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${TEAL} 0%, ${BLUE} 100%)`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
              {referredCount} חברים הצטרפו דרכך
            </div>
            <div
              style={{
                fontSize: 12,
                color: unlocked ? TEAL : '#666',
                fontWeight: unlocked ? 600 : 400,
                marginBottom: 4,
              }}
            >
              {unlocked
                ? '🎉 פתחת אפשרות שיתוף מיזם!'
                : `עוד ${remainingFriends} חברים — ותוכל לשתף את המיזם שלך`}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- FULL VARIANT ----------
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${unlocked ? GOLD : '#E8E5DE'}`,
        borderRadius: 12,
        padding: '16px 18px',
        direction: 'rtl',
        textAlign: 'right',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: AMBER, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 14, color: '#888' }}>/ {MAX_SCORE} נקודות</span>
        <span aria-hidden="true" style={{ marginInlineStart: 'auto', fontSize: 22 }}>
          🏆
        </span>
      </div>

      <div
        style={{
          height: 10,
          background: BLUE_LT,
          borderRadius: 5,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: unlocked
              ? `linear-gradient(90deg, ${GOLD} 0%, ${AMBER} 100%)`
              : `linear-gradient(90deg, ${TEAL} 0%, ${BLUE} 100%)`,
            transition: 'width 0.3s',
          }}
        />
      </div>

      <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
        {referredCount} חברים הצטרפו דרכך
      </div>

      <div
        style={{
          fontSize: 13,
          color: unlocked ? TEAL : NAVY,
          fontWeight: unlocked ? 600 : 500,
          marginBottom: 14,
          lineHeight: 1.5,
        }}
      >
        {unlocked
          ? '🎉 פתחת אפשרות שיתוף מיזם!'
          : `עוד ${remainingFriends} חברים — ותוכל לשתף את המיזם שלך`}
      </div>

      <div
        style={{
          background: BLUE_LT,
          borderRadius: 10,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>הקישור האישי שלך</div>
          <div
            style={{
              fontSize: 12,
              color: BLUE_DK,
              direction: 'ltr',
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'monospace',
            }}
            title={shareLink}
          >
            {shareLink}
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: '6px 12px',
            background: copied ? TEAL : BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          {copied ? 'הועתק ✓' : 'העתק קישור'}
        </button>
      </div>
    </div>
  );
}
