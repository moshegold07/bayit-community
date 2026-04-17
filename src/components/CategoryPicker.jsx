import { useState, useMemo } from 'react';
import { BLUE, BLUE_LT, BLUE_DK } from './shared';
import { TAXONOMY, MAX_CATEGORIES, parentOf, categoryLabel } from '../utils/categories';

export default function CategoryPicker({ value = [], onChange }) {
  const [openParent, setOpenParent] = useState(null);
  const [custom, setCustom] = useState('');

  const selectedByParent = useMemo(() => {
    const map = {};
    for (const key of value) {
      const p = parentOf(key);
      map[p] = (map[p] || 0) + 1;
    }
    return map;
  }, [value]);

  const atMax = value.length >= MAX_CATEGORIES;

  function toggle(key) {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      if (atMax) return;
      onChange([...value, key]);
    }
  }

  function addCustom() {
    const c = custom.trim();
    if (!c) return;
    const key = `other:${c}`;
    if (value.includes(key)) {
      setCustom('');
      return;
    }
    if (atMax) return;
    onChange([...value, key]);
    setCustom('');
  }

  function removeKey(key) {
    onChange(value.filter((k) => k !== key));
  }

  return (
    <div>
      {/* Parent chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {TAXONOMY.map((parent) => {
          const count = selectedByParent[parent.key] || 0;
          const isOpen = openParent === parent.key;
          const hasSelection = count > 0;
          return (
            <button
              key={parent.key}
              onClick={() => setOpenParent(isOpen ? null : parent.key)}
              type="button"
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                cursor: 'pointer',
                border: hasSelection ? `1.5px solid ${BLUE}` : '0.5px solid #ccc',
                background: isOpen ? BLUE_LT : hasSelection ? BLUE_LT : '#fff',
                color: hasSelection ? BLUE_DK : '#444',
                fontWeight: hasSelection ? 500 : 400,
                transition: 'all 0.1s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{parent.label}</span>
              {count > 0 && (
                <span
                  style={{
                    background: BLUE,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 10,
                    padding: '1px 6px',
                    minWidth: 16,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              )}
              <span style={{ fontSize: 10, color: '#888' }}>{isOpen ? '▲' : '▼'}</span>
            </button>
          );
        })}
      </div>

      {/* Sub chips for the open parent */}
      {openParent && (
        <div
          style={{
            background: '#FAFAF7',
            border: '0.5px solid #E8E5DE',
            borderRadius: 10,
            padding: 10,
            marginBottom: 10,
          }}
        >
          {(() => {
            const parent = TAXONOMY.find((p) => p.key === openParent);
            if (!parent) return null;
            return (
              <>
                {parent.subs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parent.subs.map((sub) => {
                      const fullKey = `${parent.key}:${sub.key}`;
                      const selected = value.includes(fullKey);
                      const disabled = !selected && atMax;
                      return (
                        <button
                          key={fullKey}
                          type="button"
                          onClick={() => toggle(fullKey)}
                          disabled={disabled}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 16,
                            fontSize: 12,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            border: selected ? `1.5px solid ${BLUE}` : '0.5px solid #ccc',
                            background: selected ? BLUE_LT : '#fff',
                            color: selected ? BLUE_DK : disabled ? '#bbb' : '#555',
                            fontWeight: selected ? 500 : 400,
                          }}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Custom input for "other" */}
                {parent.allowCustom && (
                  <div style={{ display: 'flex', gap: 8, marginTop: parent.subs.length ? 10 : 0 }}>
                    <input
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        border: '0.5px solid #ccc',
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: 'sans-serif',
                      }}
                      placeholder="הוסף תחום משלך..."
                      dir="auto"
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                      disabled={atMax}
                    />
                    <button
                      type="button"
                      onClick={addCustom}
                      disabled={!custom.trim() || atMax}
                      style={{
                        padding: '7px 14px',
                        background: BLUE,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        cursor: 'pointer',
                        opacity: !custom.trim() || atMax ? 0.5 : 1,
                      }}
                    >
                      הוסף
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Selected pills (full breakdown) */}
      {value.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
            נבחרו {value.length}/{MAX_CATEGORIES}
            {atMax && ' — מקסימום נבחר'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {value.map((key) => (
              <span
                key={key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 16,
                  background: BLUE_LT,
                  color: BLUE_DK,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {categoryLabel(key)}
                <button
                  type="button"
                  onClick={() => removeKey(key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: BLUE_DK,
                    cursor: 'pointer',
                    fontSize: 14,
                    lineHeight: 1,
                    padding: 0,
                  }}
                  aria-label="הסר"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
