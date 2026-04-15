import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { s, BLUE, BLUE_LT, BLUE_DK } from '../components/shared';
import ProjectCard from '../components/ProjectCard';

const STATUS_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'looking', label: 'מחפש שותפים' },
  { value: 'active', label: 'פעיל' },
  { value: 'completed', label: 'הושלם' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'הכי חדש' },
  { value: 'members', label: 'הכי הרבה חברים' },
];

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    async function load() {
      try {
        const docs = await db.getDocs('projects');
        setProjects(
          docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = projects
    .filter((p) => {
      const txt = [p.title, p.description, p.createdByName, ...(p.categories || []), ...(p.lookingFor || [])]
        .join(' ')
        .toLowerCase();
      return (
        (!search || txt.includes(search.toLowerCase())) &&
        (!filterStatus || p.status === filterStatus)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'members') return (b.memberCount || 0) - (a.memberCount || 0);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

  const activeCount = projects.filter((p) => p.status === 'active' || p.status === 'looking').length;

  const selStyle = { ...s.input, flex: 1, minWidth: 130 };

  return (
    <div style={{ ...s.body, maxWidth: 900 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: '#222' }}>
          פרויקטים
        </h1>
        <button
          onClick={() => navigate('/projects/new')}
          style={{
            ...s.btnPrimary,
            width: 'auto',
            padding: '8px 20px',
            marginTop: 0,
            fontSize: 14,
          }}
        >
          + פרויקט חדש
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          style={{ ...s.input, flex: 2, minWidth: 180 }}
          placeholder="חיפוש פרויקטים..."
          dir="auto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={selStyle}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          style={selStyle}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
        {[
          ['סה"כ פרויקטים', projects.length],
          ['פרויקטים פעילים', activeCount],
        ].map(([label, val]) => (
          <div
            key={label}
            style={{
              background: '#fff',
              border: '0.5px solid #e0e0da',
              borderRadius: 8,
              padding: '10px 16px',
              flex: 1,
            }}
          >
            <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: BLUE }}>{val}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>טוען...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
          {projects.length === 0 ? 'אין פרויקטים כרגע' : 'לא נמצאו תוצאות'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
            gap: 12,
          }}
        >
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
