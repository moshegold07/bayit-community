export const BLUE = '#3B7DD8';
export const BLUE_DK = '#1C2638';
export const BLUE_LT = '#EDF4FB';
export const CREAM = '#F5EDE0';
export const AMBER = '#E8A838';
export const AMBER_LT = '#FFF8EB';
export const GREEN = '#2E8B6A';
export const TEAL = '#1A8A7D';
export const NAVY = '#1C2638';
export const GOLD = '#D4A34A';
export const DEV_PURPLE = '#7C5CBF';

export const s = {
  wrap: { fontFamily: 'sans-serif', minHeight: '100vh', background: '#F7F6F2', direction: 'rtl' },
  hdr: {
    background: `linear-gradient(135deg, ${NAVY} 0%, #2A3650 100%)`,
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  logo: { color: GOLD, fontSize: 28, fontWeight: 600, lineHeight: 1 },
  sub: { color: 'rgba(212,163,74,0.6)', fontSize: 11, letterSpacing: 1, marginTop: 2 },
  body: { padding: '1.5rem', maxWidth: 640, margin: '0 auto', textAlign: 'right' },
  card: { background: '#fff', border: '1px solid #E8E5DE', borderRadius: 12, padding: '1.25rem' },
  label: { display: 'block', fontSize: 12, color: '#666', marginBottom: 4 },
  input: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #D5D0C8',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #D5D0C8',
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
    background: `linear-gradient(135deg, ${TEAL} 0%, #1A7A6F 100%)`,
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
    background: 'rgba(255,255,255,0.08)',
    color: CREAM,
    border: '1px solid rgba(212,163,74,0.35)',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnSolid: {
    padding: '6px 14px',
    background: GOLD,
    color: NAVY,
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  err: { color: '#A32D2D', fontSize: 11, marginTop: 3 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: '#888',
    margin: '16px 0 8px',
    paddingBottom: 6,
    borderBottom: '1px solid #E8E5DE',
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' },
  fieldRow: { marginBottom: 12 },
  navWrap: {
    background: `linear-gradient(135deg, ${NAVY} 0%, #2A3650 100%)`,
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    direction: 'rtl',
    borderBottom: `2px solid ${GOLD}`,
  },
  navLink: {
    color: 'rgba(245,237,224,0.7)',
    textDecoration: 'none',
    fontSize: 14,
    padding: '5px 12px',
    borderRadius: 6,
    transition: 'all 0.2s',
  },
  navLinkActive: {
    color: GOLD,
    background: 'rgba(212,163,74,0.12)',
    fontWeight: 600,
  },
  tag: {
    fontSize: 11,
    padding: '2px 9px',
    borderRadius: 20,
    background: BLUE_LT,
    color: '#2A5A8A',
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

export function maskPhone(phone) {
  if (!phone || phone.length < 7) return '***';
  return phone.slice(0, 4) + '****' + phone.slice(-2);
}

export function safeHref(url) {
  if (!url) return '#';
  const t = url.trim().toLowerCase();
  if (t.startsWith('http://') || t.startsWith('https://')) return url;
  return '#';
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
