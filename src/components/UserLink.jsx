import { useProfileModal } from '../contexts/ProfileModalContext';

const baseStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'inherit',
  textDecoration: 'none',
  display: 'inline',
};

/**
 * Clickable user name/avatar wrapper that opens the MemberProfileModal.
 * Falls back to a plain <span> when no uid is provided (e.g. legacy feed entries).
 */
export default function UserLink({ uid, children, style, title, stopPropagation = true }) {
  const { openProfile } = useProfileModal();

  if (!uid) {
    return <span style={style}>{children}</span>;
  }

  function handleClick(e) {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    openProfile(uid);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title || 'צפייה בפרופיל'}
      style={{ ...baseStyle, ...style }}
    >
      {children}
    </button>
  );
}
