import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE, CREAM } from './shared';
import HouseRulesModal from './HouseRulesModal';
import SearchDropdown from './SearchDropdown';

const NAV_LINKS = [
  { to: '/', label: 'חברים' },
  { to: '/events', label: 'אירועים' },
  { to: '/projects', label: 'פרויקטים' },
  { to: '/resources', label: 'משאבים' },
];

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      {NAV_LINKS.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setMenuOpen(false)}
          style={{
            ...s.navLink,
            ...(isActive(to) ? s.navLinkActive : {}),
            textDecoration: 'none',
          }}
        >
          {label}
        </Link>
      ))}
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
          ניהול
        </Link>
      )}
    </>
  );

  const actionItems = (
    <>
      <button style={s.btnOutline} onClick={() => { setShowRules(true); setMenuOpen(false); }}>
        חוקי הבית
      </button>
      <Link
        to="/edit-profile"
        onClick={() => setMenuOpen(false)}
        style={{ ...s.btnOutline, textDecoration: 'none', display: 'inline-block' }}
      >
        עריכת פרופיל
      </Link>
      <button style={s.btnOutline} onClick={handleLogout}>
        התנתקות
      </button>
    </>
  );

  return (
    <>
      {showRules && <HouseRulesModal onClose={() => setShowRules(false)} />}
      <div style={s.navWrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={s.logo}>בַּיִת</div>
            <div style={s.sub}>— יזמים עבור יזמים —</div>
          </Link>
          <nav style={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
          }}>
            <div className="nav-links-desktop" style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}>
              {linkItems}
            </div>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="nav-search-desktop" style={{ display: 'flex', alignItems: 'center' }}>
            <SearchDropdown />
          </div>
          {user && (
            <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)' }}>
              שלום, {user.first}
            </span>
          )}
          <div className="nav-actions-desktop" style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}>
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
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid rgba(245,240,232,0.2)',
          }}>
            <SearchDropdown isMobile />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {linkItems}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {actionItems}
            </div>
          </div>
        )}
      </div>

      <style>{`
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
