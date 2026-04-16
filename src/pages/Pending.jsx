import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { s, Header } from '../components/shared';

export default function Pending() {
  const navigate = useNavigate();

  async function handleLogout() {
    await auth.signOut();
    navigate('/login');
  }

  return (
    <div style={s.wrap}>
      <Header>
        <button style={s.btnOutline} onClick={handleLogout}>
          התנתקות
        </button>
      </Header>
      <div style={s.body}>
        <div
          style={{
            background: '#FAEEDA',
            border: '0.5px solid #EF9F27',
            borderRadius: 12,
            padding: '1.5rem',
            textAlign: 'center',
            marginTop: '1rem',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 500, color: '#633806', marginBottom: 8 }}>
            הבקשה שלך התקבלה!
          </div>
          <div style={{ fontSize: 14, color: '#854F0B', marginBottom: 12 }}>
            הפרופיל שלך ממתין לאישור מנהל. בינתיים ניתן לצפות בתכני הקהילה.
          </div>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: '#EF9F27',
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            צפייה בקהילה
          </a>
        </div>
      </div>
    </div>
  );
}
