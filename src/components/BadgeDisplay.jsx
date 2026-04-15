export const BADGE_DEFS = {
  'early-adopter':    { label: 'חלוץ',           color: '#EF9F27', icon: '⭐' },
  'first-event':      { label: 'אירוע ראשון',    color: '#1A8080', icon: '📅' },
  'project-creator':  { label: 'יוצר פרויקט',    color: '#7A4F9A', icon: '🚀' },
  'helpful':          { label: 'עוזר',            color: '#B05020', icon: '🤝' },
  'active-member':    { label: 'חבר פעיל',        color: '#1A6FBF', icon: '💪' },
  'mentor':           { label: 'מנטור',           color: '#2D8A4E', icon: '🎓' },
  'connector':        { label: 'מחבר',            color: '#C44569', icon: '🔗' },
};

const SIZES = {
  sm: { fontSize: 11, padding: '2px 8px' },
  md: { fontSize: 13, padding: '4px 12px' },
};

export default function BadgeDisplay({ badges, size = 'sm' }) {
  if (!badges || badges.length === 0) return null;

  const sz = SIZES[size] || SIZES.sm;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {badges.map((id) => {
        const def = BADGE_DEFS[id];
        if (!def) return null;
        return (
          <span
            key={id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 20,
              background: def.color + '26',
              color: def.color,
              fontWeight: 500,
              ...sz,
            }}
          >
            <span>{def.icon}</span>
            <span>{def.label}</span>
          </span>
        );
      })}
    </div>
  );
}
