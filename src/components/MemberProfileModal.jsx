import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useProfileModal } from '../contexts/ProfileModalContext';
import { BLUE, BLUE_LT, NAVY, GOLD } from './shared';
import BadgeDisplay from './BadgeDisplay';
import CategoryDisplay from './CategoryDisplay';
import { useT } from '../i18n';

const AV = ['#1A8A7D', '#2A5A8A', '#8B6AAE', '#C47A3A', '#5A8A6A'];
function avColor(id = '') {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}
function initials(m = {}) {
  return (m.first?.[0] || '') + (m.last?.[0] || '');
}

/**
 * A field is visible unless visibility[key] === false.
 * Missing entry = default true (matches EditProfile defaults).
 */
function isVisible(visibility, key) {
  if (!visibility) return true;
  return visibility[key] !== false;
}

const baseOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(28, 38, 56, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const cardStyle = {
  background: '#fff',
  borderRadius: 14,
  width: '100%',
  maxWidth: 460,
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '1.25rem',
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  position: 'relative',
};

const closeBtnStyle = {
  position: 'absolute',
  top: 10,
  left: 10,
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  background: '#F2F0EA',
  color: NAVY,
  fontSize: 18,
  cursor: 'pointer',
  lineHeight: 1,
};

function Field({ label, children }) {
  if (!children) return null;
  return (
    <div style={{ background: BLUE_LT, borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 11, color: '#2A5A8A', fontWeight: 600, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: '#333', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {children}
      </div>
    </div>
  );
}

function ExternalLink({ href, label }) {
  if (!href) return null;
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: BLUE, textDecoration: 'none', fontSize: 13, wordBreak: 'break-all' }}
    >
      {label || url}
    </a>
  );
}

export default function MemberProfileModal() {
  const { t, dir } = useT();
  const { openUid, closeProfile } = useProfileModal();
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Self → redirect to edit profile
  useEffect(() => {
    if (!openUid) return;
    if (user && openUid === user.uid) {
      closeProfile();
      navigate('/edit-profile');
    }
  }, [openUid, user, closeProfile, navigate]);

  // Fetch member
  useEffect(() => {
    if (!openUid || (user && openUid === user.uid)) {
      setMember(null);
      setErr('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr('');
    (async () => {
      try {
        const snap = await db.getDoc('users', openUid);
        if (cancelled) return;
        if (!snap.exists()) {
          setErr(t('members.modal.userNotFound'));
          setMember(null);
        } else {
          const data = snap.data();
          if (data.status !== 'active') {
            setErr(t('members.modal.profileUnavailable'));
            setMember(null);
          } else {
            setMember({ uid: openUid, ...data });
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load member profile:', e);
          setErr(t('members.modal.loadError'));
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [openUid, user]);

  // ESC to close
  useEffect(() => {
    if (!openUid) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') closeProfile();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openUid, closeProfile]);

  if (!openUid) return null;
  // Don't render anything while self-redirect is in flight
  if (user && openUid === user.uid) return null;

  const name = member ? `${member.first || ''} ${member.last || ''}`.trim() : '';
  const vis = member?.visibility;

  return (
    <div
      style={{ ...baseOverlayStyle, direction: dir }}
      onClick={closeProfile}
      role="dialog"
      aria-modal="true"
    >
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={closeProfile}
          aria-label={t('members.modal.closeAria')}
          style={closeBtnStyle}
        >
          ×
        </button>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            {t('members.modal.loading')}
          </div>
        )}

        {err && !loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#A32D2D' }}>{err}</div>
        )}

        {member && !loading && (
          <>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 14,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: avColor(member.uid),
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {initials(member)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>
                  {name || t('members.modal.noName')}
                </div>
                {isVisible(vis, 'city') && member.city && (
                  <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{member.city}</div>
                )}
              </div>
            </div>

            {member.badges?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <BadgeDisplay badges={member.badges} size="sm" />
              </div>
            )}

            {member.categories?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <CategoryDisplay categories={member.categories} size="sm" />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isVisible(vis, 'does') && (
                <Field label={t('members.modal.fields.does')}>{member.does}</Field>
              )}
              {isVisible(vis, 'needs') && (
                <Field label={t('members.modal.fields.needs')}>{member.needs}</Field>
              )}
              <Field label={t('members.modal.fields.strength')}>{member.strength}</Field>
              <Field label={t('members.modal.fields.canHelpWith')}>{member.canHelpWith}</Field>

              {(isVisible(vis, 'li') && member.li) ||
              (isVisible(vis, 'website') && member.website) ||
              (isVisible(vis, 'phone') && member.phone) ? (
                <div
                  style={{
                    background: '#FAF7F0',
                    borderRadius: 8,
                    padding: '8px 10px',
                    borderRight: `3px solid ${GOLD}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {isVisible(vis, 'phone') && member.phone && (
                    <div style={{ fontSize: 13, color: '#333' }}>
                      <span style={{ color: '#666' }}>{t('members.modal.fields.phone')}</span>
                      <a
                        href={`tel:${member.phone}`}
                        style={{ color: BLUE, textDecoration: 'none' }}
                      >
                        {member.phone}
                      </a>
                    </div>
                  )}
                  {isVisible(vis, 'li') && member.li && (
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>{t('members.modal.fields.li')}</span>
                      <ExternalLink href={member.li} label={member.li} />
                    </div>
                  )}
                  {isVisible(vis, 'website') && member.website && (
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>{t('members.modal.fields.website')}</span>
                      <ExternalLink href={member.website} label={member.website} />
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {!isPending && user && user.uid !== member.uid && (
                <button
                  type="button"
                  onClick={() => {
                    closeProfile();
                    navigate(`/messages?to=${member.uid}&name=${encodeURIComponent(name)}`);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: BLUE,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {t('members.modal.sendMessage')}
                </button>
              )}
              <button
                type="button"
                onClick={closeProfile}
                style={{
                  flex: isPending ? 1 : 0,
                  padding: '10px 14px',
                  background: '#F2F0EA',
                  color: NAVY,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {t('common.close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
