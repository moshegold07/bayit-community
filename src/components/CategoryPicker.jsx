import { useState } from 'react';
import { BLUE, BLUE_LT, BLUE_DK } from './shared';

const CATEGORIES = [
  'SaaS / תוכנה',
  'AI / ML',
  'Cybersecurity',
  'FinTech',
  'EdTech',
  'HealthTech',
  'HRTech',
  'ClimateTech',
  'ייעוץ עסקי',
  'ניהול פרויקטים',
  'השקעות / פיננסים',
  'מכירות ו-BD',
  'שיווק דיגיטלי',
  'נדל"ן',
  'בנייה והנדסה',
  'מדיה ותוכן',
  'עיצוב ו-UX',
  'יזמות כללית',
];

const MAX = 4;

export default function CategoryPicker({ value = [], onChange }) {
  const [custom, setCustom] = useState('');

  function toggle(cat) {
    if (value.includes(cat)) {
      onChange(value.filter((c) => c !== cat));
    } else {
      if (value.length >= MAX) return;
      onChange([...value, cat]);
    }
  }

  function addCustom() {
    const c = custom.trim();
    if (!c || value.includes(c)) {
      setCustom('');
      return;
    }
    if (value.length >= MAX) return;
    onChange([...value, c]);
    setCustom('');
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {CATEGORIES.map((cat) => {
          const selected = value.includes(cat);
          const disabled = !selected && value.length >= MAX;
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              disabled={disabled}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 13,
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: selected ? `1.5px solid ${BLUE}` : '0.5px solid #ccc',
                background: selected ? BLUE_LT : '#fff',
                color: selected ? BLUE_DK : disabled ? '#bbb' : '#444',
                fontWeight: selected ? 500 : 400,
                transition: 'all 0.1s',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
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
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          disabled={value.length >= MAX}
        />
        <button
          onClick={addCustom}
          disabled={!custom.trim() || value.length >= MAX}
          style={{
            padding: '7px 14px',
            background: BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
            opacity: !custom.trim() || value.length >= MAX ? 0.5 : 1,
          }}
        >
          הוסף
        </button>
      </div>

      {value.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
          נבחרו {value.length}/{MAX}
          {value.length >= MAX && ' — מקסימום נבחר'}
        </div>
      )}
    </div>
  );
}
