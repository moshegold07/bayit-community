import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { BLUE_DK, BLUE_LT } from './shared';

const CATEGORIES = [
  { key: 'users', label: 'חברים' },
  { key: 'events', label: 'אירועים' },
  { key: 'projects', label: 'פרויקטים' },
  { key: 'resources', label: 'משאבים' },
];

const MAX_PER_CATEGORY = 5;

function matchText(text, query) {
  if (!text) return false;
  const val = typeof text === 'string' ? text : Array.isArray(text) ? text.join(' ') : String(text);
  return val.toLowerCase().includes(query.toLowerCase());
}

function filterUsers(users, q) {
  return users
    .filter(
      (u) =>
        matchText(u.first, q) ||
        matchText(u.last, q) ||
        matchText(u.city, q) ||
        matchText(u.domain, q) ||
        matchText(u.does, q) ||
        matchText(u.needs, q),
    )
    .slice(0, MAX_PER_CATEGORY);
}

function filterEvents(events, q) {
  return events
    .filter((e) => matchText(e.title, q) || matchText(e.description, q) || matchText(e.location, q))
    .slice(0, MAX_PER_CATEGORY);
}

function filterProjects(projects, q) {
  return projects
    .filter(
      (p) => matchText(p.title, q) || matchText(p.description, q) || matchText(p.categories, q),
    )
    .slice(0, MAX_PER_CATEGORY);
}

function filterResources(resources, q) {
  return resources
    .filter(
      (r) =>
        matchText(r.title, q) ||
        matchText(r.description, q) ||
        matchText(r.tags, q) ||
        matchText(r.url, q),
    )
    .slice(0, MAX_PER_CATEGORY);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export default function SearchDropdown({ isMobile }) {
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [allUsers, setAllUsers] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);

  // Lazy-load all collections on first focus
  async function loadData() {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const [u, e, p, r] = await Promise.all([
        db.getDocs('users', [{ field: 'status', op: 'EQUAL', value: 'active' }]),
        db.getDocs('events'),
        db.getDocs('projects'),
        db.getDocs('resources'),
      ]);
      setAllUsers(u.map((d) => ({ id: d.id, ...d.data() })));
      setAllEvents(e.map((d) => ({ id: d.id, ...d.data() })));
      setAllProjects(p.map((d) => ({ id: d.id, ...d.data() })));
      setAllResources(r.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded(true);
    } catch {
      loadedRef.current = false; // Allow retry on failure
    }
  }

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build filtered results
  const q = debouncedQuery.trim();
  const results = q
    ? {
        users: filterUsers(allUsers, q),
        events: filterEvents(allEvents, q),
        projects: filterProjects(allProjects, q),
        resources: filterResources(allResources, q),
      }
    : null;

  const hasResults =
    results &&
    (results.users.length > 0 ||
      results.events.length > 0 ||
      results.projects.length > 0 ||
      results.resources.length > 0);

  function handleNavigate(path) {
    setQuery('');
    setDebouncedQuery('');
    setShowDropdown(false);
    navigate(path);
  }

  function renderUserRow(u) {
    const name = [u.first, u.last].filter(Boolean).join(' ');
    return (
      <button
        key={u.id}
        onClick={() => handleNavigate('/')}
        style={styles.resultRow}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = BLUE_LT;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={styles.resultTitle}>{name}</span>
        {u.city && <span style={styles.resultSub}>{u.city}</span>}
      </button>
    );
  }

  function renderEventRow(ev) {
    return (
      <button
        key={ev.id}
        onClick={() => handleNavigate(`/events/${ev.id}`)}
        style={styles.resultRow}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = BLUE_LT;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={styles.resultTitle}>{ev.title}</span>
        {ev.date && <span style={styles.resultSub}>{formatDate(ev.date)}</span>}
      </button>
    );
  }

  function renderProjectRow(p) {
    return (
      <button
        key={p.id}
        onClick={() => handleNavigate(`/projects/${p.id}`)}
        style={styles.resultRow}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = BLUE_LT;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={styles.resultTitle}>{p.title}</span>
        {p.status && <span style={styles.resultSub}>{p.status}</span>}
      </button>
    );
  }

  function renderResourceRow(r) {
    return (
      <button
        key={r.id}
        onClick={() => handleNavigate('/resources')}
        style={styles.resultRow}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = BLUE_LT;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={styles.resultTitle}>{r.title}</span>
        {r.category && <span style={styles.resultSub}>{r.category}</span>}
      </button>
    );
  }

  const renderers = {
    users: renderUserRow,
    events: renderEventRow,
    projects: renderProjectRow,
    resources: renderResourceRow,
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: isMobile ? '100%' : 200 }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => {
          loadData();
          if (query.trim()) setShowDropdown(true);
        }}
        placeholder="חיפוש בקהילה..."
        style={{
          ...styles.searchInput,
          width: isMobile ? '100%' : 200,
        }}
      />
      {showDropdown && q && loaded && (
        <div style={styles.dropdown}>
          {hasResults ? (
            CATEGORIES.map(({ key, label }) => {
              const items = results[key];
              if (!items || items.length === 0) return null;
              return (
                <div key={key}>
                  <div style={styles.groupHeader}>{label}</div>
                  {items.map((item) => renderers[key](item))}
                </div>
              );
            })
          ) : (
            <div style={styles.noResults}>אין תוצאות</div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  searchInput: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    padding: '6px 12px',
    outline: 'none',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
    direction: 'rtl',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    left: 0,
    marginTop: 6,
    background: '#fff',
    border: '1px solid #E8E5DE',
    borderRadius: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    maxHeight: 400,
    overflowY: 'auto',
    zIndex: 1000,
    direction: 'rtl',
  },
  groupHeader: {
    fontSize: 11,
    fontWeight: 600,
    color: BLUE_DK,
    padding: '8px 14px 4px',
    borderBottom: '1px solid #f0f0ee',
    letterSpacing: 0.5,
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '7px 14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'right',
    fontFamily: 'sans-serif',
    fontSize: 13,
    direction: 'rtl',
    boxSizing: 'border-box',
    gap: 8,
    transition: 'background 0.1s',
  },
  resultTitle: {
    color: '#333',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  resultSub: {
    color: '#999',
    fontSize: 11,
    flexShrink: 0,
  },
  noResults: {
    padding: '14px',
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    direction: 'rtl',
  },
};
