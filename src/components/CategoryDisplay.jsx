import { useState } from 'react';
import { BLUE_LT, BLUE_DK } from './shared';
import { groupByParent } from '../utils/categories';

/**
 * Compact display: shows parent chips, click any to toggle the full sub
 * breakdown. Backward-compatible with legacy plain-string categories
 * (they fall under the "אחר" parent).
 *
 * Props:
 *  - categories: string[] (keys like 'tech:saas' or legacy strings)
 *  - size: 'sm' | 'md' (default 'sm')
 *  - bg, color: optional chip colors (default BLUE_LT / BLUE_DK)
 */
export default function CategoryDisplay({
  categories = [],
  size = 'sm',
  bg = BLUE_LT,
  color = BLUE_DK,
}) {
  const [expanded, setExpanded] = useState(false);
  const groups = groupByParent(categories);
  if (groups.length === 0) return null;

  const isSm = size === 'sm';
  const chipStyle = {
    fontSize: isSm ? 11 : 12,
    padding: isSm ? '2px 9px' : '3px 11px',
    borderRadius: 20,
    background: bg,
    color,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
  };
  const subChipStyle = {
    ...chipStyle,
    fontSize: isSm ? 10 : 11,
    padding: isSm ? '1px 8px' : '2px 9px',
    background: '#fff',
    color: '#555',
    border: '0.5px solid #ccc',
    cursor: 'default',
  };

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((v) => !v);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {groups.map((g) => (
          <button
            key={g.parentKey}
            type="button"
            onClick={onClick}
            style={chipStyle}
            title={g.items.map((i) => i.label).join(', ')}
          >
            {g.parentLabel}
            {g.items.length > 1 && (
              <span style={{ marginInlineStart: 4, opacity: 0.7 }}>· {g.items.length}</span>
            )}
          </button>
        ))}
      </div>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingInlineStart: 4 }}>
          {groups.map((g) => (
            <div key={g.parentKey} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontSize: isSm ? 10 : 11, color: '#888', alignSelf: 'center' }}>
                {g.parentLabel}:
              </span>
              {g.items.map((item) => (
                <span key={item.key} style={subChipStyle}>
                  {item.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
