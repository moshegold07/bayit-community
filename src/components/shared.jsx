export const BLUE = '#2563EB';
export const BLUE_DK = '#1E40AF';
export const BLUE_LT = '#EFF6FF';
export const CREAM = '#F5F0E8';
export const AMBER = '#F59E0B';
export const AMBER_LT = '#FEF3C7';
export const GREEN = '#059669';

export const s = {
  wrap: { fontFamily: 'sans-serif', minHeight: '100vh', background: '#F8FAFC' },
  hdr: {
    background: BLUE,
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  logo: { color: CREAM, fontSize: 28, fontWeight: 500, lineHeight: 1 },
  sub: { color: 'rgba(245,240,232,0.65)', fontSize: 11, letterSpacing: 1, marginTop: 2 },
  body: { padding: '1.5rem', maxWidth: 640, margin: '0 auto', textAlign: 'right' },
  card: { background: '#fff', border: '0.5px solid #E2E8F0', borderRadius: 12, padding: '1.25rem' },
  label: { display: 'block', fontSize: 12, color: '#666', marginBottom: 4 },
  input: {
    width: '100%',
    padding: '8px 10px',
    border: '0.5px solid #ccc',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    border: '0.5px solid #ccc',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: 60,
  },
  btnPrimary: {
    width: '100%',
    padding: 10,
    background: BLUE,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 8,
  },
  btnOutline: {
    padding: '6px 14px',
    background: 'transparent',
    color: CREAM,
    border: '0.5px solid rgba(245,240,232,0.4)',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnSolid: {
    padding: '6px 14px',
    background: CREAM,
    color: BLUE_DK,
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  err: { color: '#A32D2D', fontSize: 11, marginTop: 3 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: '#888',
    margin: '16px 0 8px',
    paddingBottom: 6,
    borderBottom: '0.5px solid #eee',
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' },
  fieldRow: { marginBottom: 12 },
  navWrap: {
    background: BLUE,
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    direction: 'rtl',
  },
  navLink: {
    color: 'rgba(245,240,232,0.75)',
    textDecoration: 'none',
    fontSize: 14,
    padding: '4px 10px',
    borderRadius: 6,
    transition: 'background 0.15s',
  },
  navLinkActive: {
    color: CREAM,
    background: 'rgba(255,255,255,0.15)',
    fontWeight: 500,
  },
  tag: {
    fontSize: 11,
    padding: '2px 9px',
    borderRadius: 20,
    background: BLUE_LT,
    color: BLUE_DK,
    fontWeight: 500,
  },
};

export function Header({ children }) {
  return (
    <div style={s.hdr}>
      <div>
        <div style={s.logo}>בַּיִת</div>
        <div style={s.sub}>— יזמים עבור יזמים —</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
}

export function FieldRow({ label, children }) {
  return (
    <div style={s.fieldRow}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

export function StrengthBar({ password }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const colors = ['#E24B4A', '#EF9F27', '#378ADD', '#639922'];
  const labels = ['חלשה', 'בינונית', 'טובה', 'חזקה'];
  return (
    <div>
      <div
        style={{
          height: 3,
          borderRadius: 2,
          marginTop: 4,
          width: score * 25 + '%',
          background: colors[score - 1] || '#ddd',
          transition: 'width 0.2s, background 0.2s',
        }}
      />
      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
        {score > 0 ? labels[score - 1] : ''}
      </div>
    </div>
  );
}
