import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE, BLUE_LT, TEAL, GOLD } from '../components/shared';
import CategoryDisplay from '../components/CategoryDisplay';
import UserLink from '../components/UserLink';
import { parentOf, parentLabel, categoryLabel } from '../utils/categories';

const AV = ['#1A8A7D', '#2A5A8A', '#8B6AAE', '#C47A3A', '#5A8A6A'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}
function initials(m) {
  return (m.first?.[0] || '') + (m.last?.[0] || '');
}

/** Split text into lowercase keywords, filtering words < 3 chars */
function extractKeywords(text) {
  if (!text) return [];
  return text
    .split(/[\s,\n\r]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3);
}

/** Calculate match between current user and another user */
function calcMatch(me, other) {
  const reasons = [];
  let score = 0;

  // 1. Category overlap (exact sub-category match) + parent overlap bonus.
  const myCategories = me.categories || [];
  const theirCategories = other.categories || [];
  const myLower = myCategories.map((c) => c.toLowerCase());
  const theirLower = theirCategories.map((c) => c.toLowerCase());
  const sharedExact = myLower.filter((c) => theirLower.includes(c));
  if (sharedExact.length > 0) {
    score += sharedExact.length * 3;
    const origShared = theirCategories.filter((c) => sharedExact.includes(c.toLowerCase()));
    reasons.push({
      type: 'categories',
      label: 'תחומים משותפים',
      items: origShared.map(categoryLabel),
    });
  }
  // Parent overlap (excludes parents already covered by exact match)
  const myParents = new Set(myCategories.map(parentOf));
  const theirParents = new Set(theirCategories.map(parentOf));
  const sharedExactParents = new Set(
    theirCategories.filter((c) => sharedExact.includes(c.toLowerCase())).map(parentOf),
  );
  const sharedParents = [...myParents].filter(
    (p) => theirParents.has(p) && !sharedExactParents.has(p) && p !== 'other',
  );
  if (sharedParents.length > 0) {
    score += sharedParents.length;
    reasons.push({
      type: 'parents',
      label: 'תחומי אב משותפים',
      items: sharedParents.map(parentLabel),
    });
  }

  // 2. I need -> they do / they can help with
  const myNeeds = extractKeywords(me.needs);
  const theirDoesText = [other.does, other.canHelpWith].filter(Boolean).join(' ').toLowerCase();
  const theyCanHelp = myNeeds.filter((kw) => theirDoesText.includes(kw));
  if (theyCanHelp.length > 0) {
    score += theyCanHelp.length * 2;
    reasons.push({
      type: 'theyHelp',
      label: 'יכול/ה לעזור לך ב',
      items: [...new Set(theyCanHelp)],
    });
  }

  // 3. I do -> they need
  const myDoesKw = extractKeywords(me.does);
  const theirNeedsText = (other.needs || '').toLowerCase();
  const theySeekMe = myDoesKw.filter((kw) => theirNeedsText.includes(kw));
  if (theySeekMe.length > 0) {
    score += theySeekMe.length * 2;
    reasons.push({
      type: 'theySeek',
      label: 'מחפש/ת את מה שאתה מציע',
      items: [...new Set(theySeekMe)],
    });
  }

  // 4. Same city bonus
  if (me.city && other.city && me.city.trim().toLowerCase() === other.city.trim().toLowerCase()) {
    score += 1;
  }

  return { score, reasons };
}

export default function Matching() {
  const { user, isPending } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs('users', [{ field: 'status', op: 'EQUAL', value: 'active' }]);
        const list = docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter((m) => m.uid !== user.uid);
        if (!cancelled) setMembers(list);
      } catch (err) {
        console.error('Failed to load members for matching:', err);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const matches = useMemo(() => {
    if (!user || !members.length) return [];
    return members
      .map((m) => {
        const { score, reasons } = calcMatch(user, m);
        return { ...m, score, reasons };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [user, members]);

  const profileIncomplete = !user?.does && !user?.needs;

  if (loading) {
    return (
      <div style={s.body}>
        <p style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>טוען...</p>
      </div>
    );
  }

  return (
    <div style={s.body}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1C2638', margin: 0 }}>
          שדכ&quot;ן עסקי
        </h1>
        <p style={{ fontSize: 14, color: '#888', margin: '6px 0 0' }}>
          התאמות מוצעות על בסיס הפרופיל שלך
        </p>
      </div>

      {/* Profile incomplete notice */}
      {profileIncomplete && (
        <div
          style={{
            ...s.card,
            marginBottom: 20,
            textAlign: 'center',
            padding: '1.5rem',
            borderRight: `4px solid ${GOLD}`,
          }}
        >
          <p style={{ fontSize: 15, color: '#555', margin: '0 0 12px' }}>
            כדי למצוא התאמות, מלא/י את השדות &quot;מה אני מציע&quot; ו&quot;מה אני מחפש&quot;
            בפרופיל שלך
          </p>
          <Link
            to="/edit-profile"
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: BLUE,
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            עדכון פרופיל
          </Link>
        </div>
      )}

      {/* Results */}
      {!profileIncomplete && matches.length === 0 && (
        <div style={{ textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 }}>
          לא נמצאו התאמות כרגע
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {matches.map((m) => (
          <MatchCard key={m.uid} match={m} isPending={isPending} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, isPending }) {
  const m = match;
  const name = `${m.first || ''} ${m.last || ''}`.trim();
  const encodedName = encodeURIComponent(name);

  return (
    <div style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top row: avatar + info + score */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar (clickable → profile) */}
        <UserLink uid={m.uid} title={`פרופיל של ${name || 'חבר'}`}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: avColor(m.uid || ''),
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials(m)}
          </div>
        </UserLink>

        {/* Name + city */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <UserLink uid={m.uid} style={{ display: 'block' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1C2638' }}>
              {name || 'ללא שם'}
            </div>
          </UserLink>
          {m.city && <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{m.city}</div>}
        </div>

        {/* Score badge */}
        <div
          style={{
            background: TEAL,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 12,
            padding: '3px 10px',
            flexShrink: 0,
          }}
        >
          {m.score}
        </div>
      </div>

      {/* Categories tags */}
      {m.categories && m.categories.length > 0 && (
        <CategoryDisplay categories={m.categories} size="sm" />
      )}

      {/* Match reasons */}
      {m.reasons && m.reasons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {m.reasons.map((r) => (
            <div
              key={r.type}
              style={{
                fontSize: 13,
                color: '#555',
                background: BLUE_LT,
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <span style={{ fontWeight: 600, color: '#2A5A8A' }}>{r.label}: </span>
              {r.items.join(', ')}
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      {!isPending && (
        <Link
          to={`/messages?to=${m.uid}&name=${encodedName}`}
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 0',
            background: BLUE,
            color: '#fff',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            marginTop: 2,
          }}
        >
          שלח הודעה
        </Link>
      )}
    </div>
  );
}
