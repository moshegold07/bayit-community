import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../i18n';
import { s, BLUE, BLUE_LT, BLUE_DK, NAVY } from '../components/shared';
import VentureCard from '../components/VentureCard';
import { TAXONOMY, parentOf, parentLabel } from '../utils/categories';

export default function Ventures() {
  const { t, dir } = useT();
  const { isPending, user } = useAuth();
  const userScore = user?.score || 0;
  const isAdmin = user?.role === 'admin';
  const canCreate = isAdmin || userScore >= 10;
  const [ventures, setVentures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterParent, setFilterParent] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const sortOptions = [
    { value: 'newest', label: t('content.ventures.list.sortNewest') },
    { value: 'queue', label: t('content.ventures.list.sortQueue') },
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs('ventures');
        if (!cancelled) {
          setVentures(docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch {
        // load failed — empty state
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const parentCounts = useMemo(() => {
    const counts = {};
    for (const v of ventures) {
      if (!v.category) continue;
      const p = parentOf(v.category);
      counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [ventures]);

  const parentsWithVentures = TAXONOMY.filter((p) => parentCounts[p.key]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = ventures.filter((v) => {
      const txt = [v.title, v.story, v.createdByName].filter(Boolean).join(' ').toLowerCase();
      const matchesParent = !filterParent || (v.category && parentOf(v.category) === filterParent);
      return (!q || txt.includes(q)) && matchesParent;
    });
    out = out.sort((a, b) => {
      if (sortBy === 'queue') return (b.queueNumber || 0) - (a.queueNumber || 0);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return out;
  }, [ventures, search, filterParent, sortBy]);

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
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: NAVY }}>
            {t('content.ventures.list.title')}
          </h1>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            {t('content.ventures.list.subtitle')}
          </div>
        </div>
        {!isPending &&
          (canCreate ? (
            <Link
              to="/ventures/new"
              style={{
                padding: '8px 18px',
                background: BLUE,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {t('content.ventures.list.addVenture')}
            </Link>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}
            >
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                title={t('content.ventures.list.addVentureLockedTitle')}
                style={{
                  padding: '8px 18px',
                  background: '#E5E5E5',
                  color: '#888',
                  border: '1px solid #D5D0C8',
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: 'not-allowed',
                  fontWeight: 500,
                }}
              >
                {t('content.ventures.list.addVentureLocked')}
              </button>
              <span style={{ fontSize: 11, color: '#888' }}>
                {t('content.ventures.list.pointsRemaining', {
                  remaining: Math.max(0, 10 - userScore),
                })}
              </span>
            </div>
          ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          style={{ ...s.input, flex: 2, minWidth: 180 }}
          placeholder={t('content.ventures.list.searchPlaceholder')}
          dir="auto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ ...s.input, flex: 1, minWidth: 140 }}
          dir={dir}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {ventures.length > 0 && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #E8E5DE',
            borderRadius: 12,
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: NAVY,
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{t('content.ventures.list.categoryHeader')}</span>
            <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>
              {t('content.ventures.list.categoryStats', {
                categories: parentsWithVentures.length,
                ventures: ventures.length,
              })}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              onClick={() => setFilterParent('')}
              style={chipStyle(filterParent === '')}
            >
              {t('content.ventures.list.categoryAll')}
              <span style={countBadge(filterParent === '')}>{ventures.length}</span>
            </button>
            {parentsWithVentures.map((p) => {
              const active = filterParent === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setFilterParent(active ? '' : p.key)}
                  style={chipStyle(active)}
                >
                  {parentLabel(p.key)}
                  <span style={countBadge(active)}>{parentCounts[p.key]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
          {t('common.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#888',
            background: '#fff',
            border: '1px dashed #D5D0C8',
            borderRadius: 12,
          }}
        >
          {ventures.length === 0
            ? t('content.ventures.list.emptyNoVentures')
            : t('content.ventures.list.emptyNoResults')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((v) => (
            <VentureCard key={v.id} venture={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function chipStyle(active) {
  return {
    padding: '5px 12px',
    borderRadius: 16,
    fontSize: 12,
    cursor: 'pointer',
    border: active ? `1.5px solid ${BLUE}` : '0.5px solid #ccc',
    background: active ? BLUE_LT : '#fff',
    color: active ? BLUE_DK : '#444',
    fontWeight: active ? 600 : 400,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };
}

function countBadge(active) {
  return {
    background: active ? BLUE : '#eee',
    color: active ? '#fff' : '#666',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 10,
    padding: '1px 7px',
    minWidth: 18,
    textAlign: 'center',
  };
}
