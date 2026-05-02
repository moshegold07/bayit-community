import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  s,
  BLUE,
  BLUE_LT,
  BLUE_DK,
  AMBER,
  AMBER_LT,
  CREAM,
  TEAL,
  GOLD,
  NAVY,
  maskPhone,
  safeHref,
  avColor,
  initials,
} from '../components/shared';
import BadgeDisplay from '../components/BadgeDisplay';
import ActivityFeed from '../components/ActivityFeed';
import EndorsementSection from '../components/EndorsementSection';
import CategoryDisplay from '../components/CategoryDisplay';
import {
  TAXONOMY,
  parentOf,
  parentLabel,
  migrateLegacyCategory,
  resolveMemberCategories,
} from '../utils/categories';

function visibleField(member, field, isAdmin) {
  if (isAdmin) return true;
  if (!member.visibility) return true; // backward compat — no setting = all visible
  return member.visibility[field] !== false;
}

function ScoreChip({ score, size = 'sm' }) {
  const s = Math.max(0, Number(score) || 0);
  const unlocked = s >= 10;
  const small = size === 'sm';
  return (
    <span
      title={`${s} חברים הצטרפו דרכך${unlocked ? ' · פתוח לשיתוף מיזם' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: small ? '2px 7px' : '3px 10px',
        borderRadius: 12,
        fontSize: small ? 11 : 13,
        fontWeight: 600,
        background: unlocked ? '#FFF4D9' : '#F2F1ED',
        color: unlocked ? '#8B6700' : '#666',
        border: `1px solid ${unlocked ? '#E8A838' : '#E0DDD7'}`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span aria-hidden="true">🏆</span>
      <span>{s}</span>
    </span>
  );
}

const BAR_COLORS = [
  '#1A8A7D',
  '#3B7DD8',
  '#8B6AAE',
  '#D4A34A',
  '#C47A3A',
  '#5A8A6A',
  '#2A5A8A',
  '#E8A838',
  '#7C5CBF',
  '#2E8B6A',
];

function DomainDistribution({ members, onSelect, activeDomain }) {
  // Aggregate by parent category (counts each member at most once per parent).
  const parentCounts = {};
  members.forEach((m) => {
    const rawCats = resolveMemberCategories(m);
    const parents = new Set();
    rawCats.forEach((c) => {
      const migrated = migrateLegacyCategory(c) || c;
      parents.add(parentOf(migrated));
    });
    parents.forEach((p) => {
      parentCounts[p] = (parentCounts[p] || 0) + 1;
    });
  });

  const sorted = Object.entries(parentCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  const max = sorted[0][1];

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E8E5DE',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: NAVY,
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>התפלגות תחומי עניין</span>
        <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>
          {sorted.length} תחומים | {members.length} חברים
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(([parentKey, count], i) => {
          const pct = Math.round((count / members.length) * 100);
          const isActive = activeDomain === parentKey;
          const label = parentLabel(parentKey);
          return (
            <div
              key={parentKey}
              onClick={() => onSelect(isActive ? '' : parentKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 6,
                background: isActive ? '#F0F7F6' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#FAFAF8';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: isActive ? TEAL : '#555',
                  fontWeight: isActive ? 600 : 400,
                  width: 110,
                  flexShrink: 0,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={label}
              >
                {label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 18,
                  background: '#F2F1ED',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(count / max) * 100}%`,
                    background: isActive ? TEAL : BAR_COLORS[i % BAR_COLORS.length],
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                    opacity: isActive ? 1 : 0.75,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: '#888',
                  width: 50,
                  flexShrink: 0,
                  textAlign: 'left',
                  fontFamily: 'monospace',
                }}
              >
                {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemberModal({ m, onClose, isAdmin, currentUser, isPending }) {
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
            {initials(m.first, m.last)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 500, fontSize: 18 }}>
                {m.first} {m.last}
              </div>
              <ScoreChip score={m.score} size="md" />
            </div>
            {visibleField(m, 'city', isAdmin) && m.city && (
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{m.city}</div>
            )}
            <div style={{ marginTop: 4 }}>
              <CategoryDisplay
                categories={m.categories?.length ? m.categories : m.domain ? [m.domain] : []}
                size="sm"
                bg="#E6F1FB"
                color="#0C447C"
              />
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

        {visibleField(m, 'does', isAdmin) && m.does && (
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
        {visibleField(m, 'needs', isAdmin) && m.needs && (
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
        {m.strength && (
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              background: '#f9f9f7',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>החוזקות שלי</div>
            <div style={{ fontSize: 14, color: '#222', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {m.strength}
            </div>
          </div>
        )}
        {m.canHelpWith && (
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              background: '#f9f9f7',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>במה אני יכול לעזור</div>
            <div style={{ fontSize: 14, color: '#222', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {m.canHelpWith}
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visibleField(m, 'phone', isAdmin) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#888' }}>טלפון</span>
              <span style={{ fontFamily: 'monospace', direction: 'ltr' }}>
                {maskPhone(m.phone)}
              </span>
            </div>
          )}
          {visibleField(m, 'li', isAdmin) && m.li && (
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
          {visibleField(m, 'website', isAdmin) && m.website && (
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

        {!isPending && (
          <Link
            to={`/messages?to=${m.uid}&name=${encodeURIComponent((m.first || '') + ' ' + (m.last || ''))}`}
            onClick={onClose}
            style={{
              display: 'block',
              width: '100%',
              padding: 10,
              background: `linear-gradient(135deg, ${AMBER} 0%, #D4922E 100%)`,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
              marginTop: '1.25rem',
              boxSizing: 'border-box',
            }}
          >
            שלח הודעה
          </Link>
        )}
        {!isPending && (
          <EndorsementSection
            targetUid={m.uid}
            targetName={(m.first || '') + ' ' + (m.last || '')}
            currentUserId={currentUser?.uid}
            currentUserName={(currentUser?.first || '') + ' ' + (currentUser?.last || '')}
          />
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: 8,
            width: '100%',
            padding: 10,
            background: NAVY,
            color: CREAM,
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

export default function Members() {
  const { user: currentUser, isPending } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [members, setMembers] = useState([]);
  const [formRegs, setFormRegs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      const docs = await db.getDocs('users', [{ field: 'status', op: 'EQUAL', value: 'active' }]);
      setMembers(docs.map((d) => ({ uid: d.id, ...d.data() })));
      try {
        const fDocs = await db.getDocs('formRegistrants', [
          { field: 'claimed', op: 'EQUAL', value: false },
        ]);
        setFormRegs(fDocs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_e) {
        /* empty */
      }
      setLoading(false);
    }
    load();
  }, []);

  // Map formRegs to member-like objects for counting & distribution
  const formRegsAsDomain = formRegs.map((r) => {
    const cats = [r.subField, r.mainField].filter((f) => f && f !== 'אחר');
    return { categories: cats, domain: cats.join(', '), city: r.location };
  });
  const allForStats = [...members, ...formRegsAsDomain];

  // Build the parent set from members so the dropdown only shows in-use parents.
  const parentsInUse = new Set();
  allForStats.forEach((m) => {
    resolveMemberCategories(m).forEach((c) =>
      parentsInUse.add(parentOf(migrateLegacyCategory(c) || c)),
    );
  });
  const parentOptions = TAXONOMY.filter((p) => parentsInUse.has(p.key));
  const cities = [...new Set(allForStats.map((m) => m.city).filter(Boolean))].sort();

  const list = members.filter((m) => {
    const txt = [m.first, m.last, m.city, m.domain, m.does, m.needs, m.strength, m.canHelpWith]
      .join(' ')
      .toLowerCase();
    const cats = resolveMemberCategories(m);
    const matchesDomain = !filterDomain
      ? true
      : cats.length === 0
        ? filterDomain === 'other'
        : cats.some((c) => parentOf(migrateLegacyCategory(c) || c) === filterDomain);
    return (
      (!search || txt.includes(search.toLowerCase())) &&
      matchesDomain &&
      (!filterCity || m.city === filterCity)
    );
  });

  // formRegs share the same filters so the "Other" bar (etc.) actually surfaces
  // matching pending registrants and isn't a dead-end UX.
  const filteredFormRegs = formRegs.filter((r) => {
    const txt = [r.fullName, r.location, r.mainField, r.subField, r.whatTheyDo]
      .join(' ')
      .toLowerCase();
    const cats = [r.subField, r.mainField].filter((f) => f && f !== 'אחר');
    const matchesDomain = !filterDomain
      ? true
      : cats.length === 0
        ? filterDomain === 'other'
        : cats.some((c) => parentOf(migrateLegacyCategory(c) || c) === filterDomain);
    return (
      (!search || txt.includes(search.toLowerCase())) &&
      matchesDomain &&
      (!filterCity || r.location === filterCity)
    );
  });

  const selStyle = { ...s.input, flex: 1, minWidth: 130 };

  return (
    <>
      {selected && (
        <MemberModal
          m={selected}
          onClose={() => setSelected(null)}
          isAdmin={isAdmin}
          currentUser={currentUser}
          isPending={isPending}
        />
      )}

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
            {parentOptions.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
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
            ['חברים', members.length + formRegs.length, TEAL],
            ['ערים', cities.length, GOLD],
            ['תחומים', parentOptions.length, '#8B6AAE'],
          ].map(([label, val, color]) => (
            <div
              key={label}
              style={{
                background: '#fff',
                border: '1px solid #E8E5DE',
                borderRadius: 10,
                padding: '10px 16px',
                flex: 1,
                borderTop: `3px solid ${color}`,
              }}
            >
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <ActivityFeed />
        </div>

        {!loading && allForStats.length > 0 && (
          <DomainDistribution
            members={allForStats}
            onSelect={setFilterDomain}
            activeDomain={filterDomain}
          />
        )}

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
            {list.length === 0 && filteredFormRegs.length === 0 && (
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
                  border: '1px solid #E8E5DE',
                  borderRadius: 12,
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = TEAL)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E8E5DE')}
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
                    {initials(m.first, m.last)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 15 }}>
                      {m.first} {m.last}
                    </div>
                    {visibleField(m, 'city', isAdmin) && m.city && (
                      <div style={{ fontSize: 12, color: '#888' }}>{m.city}</div>
                    )}
                  </div>
                  <ScoreChip score={m.score} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <CategoryDisplay
                    categories={m.categories?.length ? m.categories : m.domain ? [m.domain] : []}
                    size="sm"
                  />
                </div>
                <BadgeDisplay badges={m.badges} />
                {visibleField(m, 'does', isAdmin) && m.does && (
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                    עושה:{' '}
                    <span style={{ color: '#222' }}>
                      {m.does.slice(0, 60)}
                      {m.does.length > 60 ? '...' : ''}
                    </span>
                  </div>
                )}
                {visibleField(m, 'needs', isAdmin) && m.needs && (
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
                    {visibleField(m, 'phone', isAdmin) ? maskPhone(m.phone) : ''}
                  </span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>לחץ לפרטים ›</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredFormRegs.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: NAVY,
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>נרשמו בטופס — ממתינים להפעלה</span>
              <span
                style={{
                  fontSize: 11,
                  background: AMBER_LT,
                  color: '#8B6700',
                  borderRadius: 10,
                  padding: '2px 8px',
                  fontWeight: 500,
                }}
              >
                {filteredFormRegs.length}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
                gap: 12,
              }}
            >
              {filteredFormRegs.map((r) => {
                const nameParts = (r.fullName || '').split(/\s+/);
                const fi = nameParts[0]?.[0] || '';
                const li = nameParts[1]?.[0] || '';
                return (
                  <div
                    key={r.id}
                    style={{
                      background: '#fff',
                      border: '1px dashed #D5D0C8',
                      borderRadius: 12,
                      padding: '1rem',
                      opacity: 0.85,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: '#ccc',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 500,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {fi}
                        {li}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 15 }}>{r.fullName}</div>
                        {r.location && (
                          <div style={{ fontSize: 12, color: '#888' }}>{r.location}</div>
                        )}
                      </div>
                    </div>
                    {(() => {
                      const cats = [r.subField, r.mainField].filter((f) => f && f !== 'אחר');
                      if (cats.length === 0) return null;
                      return (
                        <CategoryDisplay categories={cats} size="sm" bg="#F5F0E8" color="#8B6700" />
                      );
                    })()}
                    {r.whatTheyDo && (
                      <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                        {r.whatTheyDo.slice(0, 80)}
                        {r.whatTheyDo.length > 80 ? '...' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
