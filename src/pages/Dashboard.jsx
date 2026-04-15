import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { s, BLUE, BLUE_LT, BLUE_DK, AMBER, maskPhone, safeHref } from '../components/shared';
import BadgeDisplay from '../components/BadgeDisplay';

const AV_COLORS = ['#1A6FBF', '#0F4F8A', '#1A8080', '#7A4F9A', '#B05020'];
function avColor(id) {
  let h = 0;
  for (let c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV_COLORS[h % 5];
}
function initials(m) {
  return (m.first?.[0] || '') + (m.last?.[0] || '');
}

function MemberModal({ m, onClose }) {
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
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '1.5rem',
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '0.5px solid #eee',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: avColor(m.phone || m.uid),
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500,
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            {initials(m)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 18 }}>
              {m.first} {m.last}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{m.city || ''}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {(m.categories?.length ? m.categories : m.domain ? [m.domain] : []).map((cat) => (
                <span
                  key={cat}
                  style={{
                    fontSize: 11,
                    padding: '2px 9px',
                    borderRadius: 20,
                    background: '#E6F1FB',
                    color: '#0C447C',
                    fontWeight: 500,
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#aaa',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {m.badges?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <BadgeDisplay badges={m.badges} size="md" />
          </div>
        )}

        {m.does && (
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              background: '#f9f9f7',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>מה אני עושה</div>
            <div style={{ fontSize: 14, color: '#222', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {m.does}
            </div>
          </div>
        )}
        {m.needs && (
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              background: '#f9f9f7',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>מה אני מחפש / צריך</div>
            <div style={{ fontSize: 14, color: '#222', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {m.needs}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#888' }}>טלפון</span>
            <span style={{ fontFamily: 'monospace', direction: 'ltr' }}>{maskPhone(m.phone)}</span>
          </div>
          {m.li && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#888' }}>לינקדין</span>
              <a
                href={safeHref(m.li)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: BLUE, textDecoration: 'none' }}
              >
                פתח פרופיל
              </a>
            </div>
          )}
          {m.website && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#888' }}>אתר</span>
              <a
                href={safeHref(m.website)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: BLUE, textDecoration: 'none' }}
              >
                {m.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        <Link
          to={`/messages?to=${m.uid}&name=${encodeURIComponent((m.first || '') + ' ' + (m.last || ''))}`}
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            padding: 10,
            background: AMBER,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            textAlign: 'center',
            textDecoration: 'none',
            marginTop: '1.25rem',
            boxSizing: 'border-box',
          }}
        >
          שלח הודעה
        </Link>
        <button
          onClick={onClose}
          style={{
            marginTop: 8,
            width: '100%',
            padding: 10,
            background: BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          סגור
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      const docs = await db.getDocs('users', [{ field: 'status', op: 'EQUAL', value: 'active' }]);
      setMembers(docs.map((d) => ({ uid: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  const domains = [
    ...new Set(
      members.flatMap((m) => (m.categories?.length ? m.categories : m.domain ? [m.domain] : [])),
    ),
  ].sort();
  const cities = [...new Set(members.map((m) => m.city).filter(Boolean))].sort();

  const list = members.filter((m) => {
    const txt = [m.first, m.last, m.city, m.domain, m.does, m.needs].join(' ').toLowerCase();
    return (
      (!search || txt.includes(search.toLowerCase())) &&
      (!filterDomain ||
        (m.categories || []).includes(filterDomain) ||
        (m.domain || '').toLowerCase().includes(filterDomain.toLowerCase())) &&
      (!filterCity || m.city === filterCity)
    );
  });

  const selStyle = { ...s.input, flex: 1, minWidth: 130 };

  return (
    <>
      {selected && <MemberModal m={selected} onClose={() => setSelected(null)} />}

      <div style={{ ...s.body, maxWidth: 900 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            style={{ ...s.input, flex: 2, minWidth: 180 }}
            placeholder="חיפוש..."
            dir="auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={selStyle}
            dir="rtl"
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
          >
            <option value="">כל התחומים</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            style={selStyle}
            dir="rtl"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">כל הערים</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
          {[
            ['חברים', members.length],
            ['ערים', cities.length],
            ['תחומים', domains.length],
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
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
              gap: 12,
            }}
          >
            {list.length === 0 && (
              <div
                style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#888' }}
              >
                לא נמצאו תוצאות
              </div>
            )}
            {list.map((m) => (
              <div
                key={m.uid}
                onClick={() => setSelected(m)}
                style={{
                  background: '#fff',
                  border: '0.5px solid #e0e0da',
                  borderRadius: 12,
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = BLUE)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e0e0da')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: avColor(m.phone || m.uid),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {initials(m)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 15 }}>
                      {m.first} {m.last}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>{m.city}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {(m.categories?.length ? m.categories : m.domain ? [m.domain] : []).map((cat) => (
                    <span
                      key={cat}
                      style={{
                        fontSize: 11,
                        padding: '2px 9px',
                        borderRadius: 20,
                        background: BLUE_LT,
                        color: BLUE_DK,
                        fontWeight: 500,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                <BadgeDisplay badges={m.badges} />
                {m.does && (
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                    עושה:{' '}
                    <span style={{ color: '#222' }}>
                      {m.does.slice(0, 60)}
                      {m.does.length > 60 ? '...' : ''}
                    </span>
                  </div>
                )}
                {m.needs && (
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                    צריך:{' '}
                    <span style={{ color: '#222' }}>
                      {m.needs.slice(0, 60)}
                      {m.needs.length > 60 ? '...' : ''}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '0.5px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: '#888',
                      fontFamily: 'monospace',
                      direction: 'ltr',
                    }}
                  >
                    {maskPhone(m.phone)}
                  </span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>לחץ לפרטים ›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
