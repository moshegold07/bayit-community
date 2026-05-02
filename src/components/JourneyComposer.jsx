import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../i18n';
import { BLUE, BLUE_DK, AMBER, NAVY, CREAM } from './shared';

const MAX_LEN = 200;

export default function JourneyComposer({ onPosted, onClose }) {
  const { t, dir } = useT();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showIdeas, setShowIdeas] = useState(false);
  const textareaRef = useRef(null);

  const ideaPrompts = useMemo(
    () => [
      t('content.journey.composer.ideaPrompt1'),
      t('content.journey.composer.ideaPrompt2'),
      t('content.journey.composer.ideaPrompt3'),
      t('content.journey.composer.ideaPrompt4'),
    ],
    [t],
  );

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ESC key handler — disabled while submitting
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !submitting) {
        onClose?.();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitting, onClose]);

  if (!user) return null;

  const trimmed = text.trim();
  const len = text.length;
  const tooLong = len > MAX_LEN;
  const valid = trimmed.length > 0 && !tooLong;

  // Char counter color logic
  let counterColor = '#888';
  if (len >= MAX_LEN) counterColor = '#E24B4A';
  else if (len >= 180) counterColor = AMBER;

  function handleBackdropClick() {
    if (submitting) return;
    onClose?.();
  }

  function pickIdea(prompt) {
    if (text.trim().length > 10) {
      const ok = window.confirm(t('content.journey.composer.replaceConfirm'));
      if (!ok) return;
    }
    setText(prompt);
    textareaRef.current?.focus();
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!valid || submitting) return;
    setSubmitting(true);
    setServerError('');

    const authorName =
      `${user.first || ''} ${user.last || ''}`.trim() ||
      t('content.journey.composer.authorFallback');
    const docPayload = {
      authorId: user.uid,
      authorName,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    try {
      const id = await db.addDoc('journeyPosts', docPayload);
      onPosted?.({ id, ...docPayload });
      onClose?.();
    } catch (err) {
      setServerError(err?.message || t('content.journey.composer.errSavePost'));
      setSubmitting(false);
    }
  }

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
      onClick={handleBackdropClick}
      dir={dir}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '1.5rem',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
          <div style={{ fontSize: 17, fontWeight: 600, color: NAVY }}>
            <span aria-hidden="true">📔 </span>
            {t('content.journey.composer.title')}
          </div>
          <button
            onClick={() => !submitting && onClose?.()}
            disabled={submitting}
            aria-label={t('content.journey.composer.closeAria')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: submitting ? 'not-allowed' : 'pointer',
              color: '#aaa',
              lineHeight: 1,
              padding: 0,
              opacity: submitting ? 0.4 : 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('content.journey.composer.placeholder')}
            maxLength={MAX_LEN + 20 /* allow paste-then-trim UX */}
            disabled={submitting}
            dir="auto"
            rows={4}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 15,
              lineHeight: 1.6,
              border: `1px solid ${tooLong ? '#E24B4A' : '#D5D0C8'}`,
              borderRadius: 10,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              background: submitting ? '#f7f7f5' : '#fff',
            }}
            onFocus={(e) => {
              if (!tooLong) e.target.style.borderColor = BLUE;
            }}
            onBlur={(e) => {
              if (!tooLong) e.target.style.borderColor = '#D5D0C8';
            }}
          />

          {/* Char counter */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
              fontSize: 12,
            }}
          >
            <span style={{ color: '#aaa' }}>
              {tooLong ? t('content.journey.composer.tooLong') : ''}
            </span>
            <span
              style={{
                color: counterColor,
                fontFamily: 'monospace',
                fontWeight: len >= 180 ? 600 : 400,
              }}
            >
              {len}/{MAX_LEN}
            </span>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: '#FDECEC',
                color: '#A63B3A',
                border: '1px solid #F5C5C4',
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {serverError}
            </div>
          )}

          {/* Ideas section */}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setShowIdeas((v) => !v)}
              disabled={submitting}
              style={{
                background: 'none',
                border: 'none',
                color: BLUE,
                fontSize: 13,
                cursor: submitting ? 'not-allowed' : 'pointer',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              <span aria-hidden="true">💡 </span>
              {t('content.journey.composer.ideasToggle')} {showIdeas ? '▴' : '▾'}
            </button>
            {showIdeas && (
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  background: '#FAFAF8',
                  border: '1px solid #EEE',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                {ideaPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => pickIdea(p)}
                    disabled={submitting}
                    style={{
                      textAlign: dir === 'rtl' ? 'right' : 'left',
                      background: '#fff',
                      border: '1px solid #E8E5DE',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 13,
                      color: '#333',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) e.currentTarget.style.borderColor = BLUE;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E8E5DE';
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              marginTop: '1.25rem',
            }}
          >
            <button
              type="button"
              onClick={() => !submitting && onClose?.()}
              disabled={submitting}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: 13,
                cursor: submitting ? 'not-allowed' : 'pointer',
                padding: '8px 12px',
                fontFamily: 'inherit',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!valid || submitting}
              style={{
                background: !valid || submitting ? '#B7CFEC' : BLUE,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 600,
                cursor: !valid || submitting ? 'not-allowed' : 'pointer',
                minWidth: 110,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (valid && !submitting) e.currentTarget.style.background = BLUE_DK;
              }}
              onMouseLeave={(e) => {
                if (valid && !submitting) e.currentTarget.style.background = BLUE;
              }}
            >
              {submitting
                ? t('content.journey.composer.publishing')
                : t('content.journey.composer.publish')}
            </button>
          </div>
        </form>

        {/* Subtle footer hint */}
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: '#aaa',
            textAlign: 'center',
            background: CREAM,
            padding: '6px 8px',
            borderRadius: 6,
          }}
        >
          {t('content.journey.composer.footerHint')}
        </div>
      </div>
    </div>
  );
}
