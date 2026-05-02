import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, CREAM, DEV_PURPLE } from './shared';
import HouseRulesModal from './HouseRulesModal';
import SearchDropdown from './SearchDropdown';
import ScoreCube from './ScoreCube';
import LanguageSwitcher from './LanguageSwitcher';
import { useTabBadges } from '../hooks/useTabBadges';
import { useT } from '../i18n';

const NAV_LINKS = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/members', labelKey: 'nav.members' },
  { to: '/forums', labelKey: 'nav.forums' },
  { to: '/ventures', labelKey: 'nav.ventures' },
  { to: '/journey', labelKey: 'nav.journey' },
  { to: '/messages', labelKey: 'nav.messages' },
  { to: '/matching', labelKey: 'nav.matching' },
];

const badgeDotStyle = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: '#E8A838',
  display: 'inline-block',
  marginLeft: 4,
  verticalAlign: 'top',
  flexShrink: 0,
};

export default function Navbar() {
  const { user, isPending } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { badges, notificationCount } = useTabBadges(user?.uid);
  const { t } = useT();

  function isActive(to) {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  }

  async function handleLogout() {
    await auth.signOut();
    navigate('/login');
  }

  const linkItems = (
    <>
      {NAV_LINKS.filter(({ to }) => !isPending || to !== '/messages').map(({ to, labelKey }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setMenuOpen(false)}
          style={{
            ...s.navLink,
            ...(isActive(to) ? s.navLinkActive : {}),
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {t(labelKey)}
          {badges[to] && <span style={badgeDotStyle} />}
        </Link>
      ))}
      <Link
        to="/dev"
        onClick={() => setMenuOpen(false)}
        style={{
          ...s.navLink,
          ...(isActive('/dev')
            ? { color: '#D4B5FF', background: 'rgba(124,92,191,0.25)', fontWeight: 600 }
            : { color: 'rgba(212,181,255,0.7)' }),
          textDecoration: 'none',
        }}
      >
        {t('nav.dev')}
      </Link>
      {user?.role === 'admin' && (
        <Link
          to="/admin"
          onClick={() => setMenuOpen(false)}
          style={{
            ...s.navLink,
            ...(isActive('/admin') ? s.navLinkActive : {}),
            textDecoration: 'none',
          }}
        >
          {t('nav.admin')}
        </Link>
      )}
    </>
  );

  const actionItems = (
    <>
      <button
        style={s.btnOutline}
        onClick={() => {
          setShowRules(true);
          setMenuOpen(false);
        }}
      >
        {t('nav.houseRules')}
      </button>
      <Link
        to="/edit-profile"
        onClick={() => setMenuOpen(false)}
        style={{ ...s.btnOutline, textDecoration: 'none', display: 'inline-block' }}
      >
        {t('nav.editProfile')}
      </Link>
      <button style={s.btnOutline} onClick={handleLogout}>
        {t('nav.logout')}
      </button>
    </>
  );

  return (
    <>
      {showRules && <HouseRulesModal onClose={() => setShowRules(false)} />}
      <div style={s.navWrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={s.logo}>בַּיִת</div>
            <div style={s.sub}>— יזמים עבור יזמים —</div>
          </Link>
          <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <div
              className="nav-links-desktop"
              style={{ display: 'flex', gap: 2, alignItems: 'center' }}
            >
              {linkItems}
            </div>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="nav-search-desktop" style={{ display: 'flex', alignItems: 'center' }}>
            <SearchDropdown />
          </div>

          <Link
            to="/notifications"
            onClick={() => setMenuOpen(false)}
            style={{
              color: CREAM,
              textDecoration: 'none',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="20"
              height="20"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#E24B4A',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>

          {user && (
            <span
              className="nav-greeting-desktop"
              style={{ fontSize: 12, color: 'rgba(245,240,232,0.7)', whiteSpace: 'nowrap' }}
              title={t('nav.greeting', { name: user.first })}
            >
              {user.first}
            </span>
          )}
          {user && (
            <div className="nav-actions-desktop" style={{ display: 'inline-flex' }}>
              <ScoreCube compact />
            </div>
          )}
          <div
            className="nav-actions-desktop"
            style={{ display: 'flex', gap: 6, alignItems: 'center' }}
          >
            <LanguageSwitcher compact />
            {actionItems}
          </div>
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: CREAM,
              fontSize: 24,
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>

        {menuOpen && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingTop: 12,
              borderTop: '1px solid rgba(245,240,232,0.2)',
            }}
          >
            <SearchDropdown isMobile />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{linkItems}</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginTop: 4,
                alignItems: 'center',
              }}
            >
              <LanguageSwitcher />
              {actionItems}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .nav-greeting-desktop { display: none !important; }
        }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-actions-desktop { display: none !important; }
          .nav-search-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
        }
      `}</style>
    </>
  );
}
