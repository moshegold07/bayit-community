import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, Header, FieldRow } from '../components/shared';

export default function Login() {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function resetPassword() {
    setErr('');
    if (!email.trim()) {
      setErr('יש להזין אימייל לאיפוס סיסמה');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (_e) {
      setErr('שגיאה בשליחת אימייל לאיפוס. בדוק שהאימייל נכון.');
    }
  }

  async function login() {
    setErr('');
    if (!email || !pass) {
      setErr('יש למלא אימייל וסיסמא');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      await refreshUser();
    } catch (e) {
      if (
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/user-not-found'
      )
        setErr('אימייל או סיסמא שגויים');
      else setErr('שגיאה: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <Header>
        <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)' }}>חדש?</span>
        <Link
          to="/register"
          style={{ ...s.btnSolid, textDecoration: 'none', display: 'inline-block' }}
        >
          הצטרפות
        </Link>
      </Header>
      <div style={{ ...s.body, maxWidth: 400 }}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#222' }}>התחברות</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              הכנס/י את פרטי הגישה שלך
            </div>
          </div>
          {err && (
            <div
              style={{
                background: '#FCEBEB',
                color: '#791F1F',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 14,
                fontSize: 13,
              }}
            >
              {err}
            </div>
          )}
          <FieldRow label="אימייל">
            <input
              style={s.input}
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
            />
          </FieldRow>
          <FieldRow label="סיסמא">
            <input
              style={s.input}
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
            />
          </FieldRow>
          <button
            style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
            onClick={login}
            disabled={loading}
          >
            {loading ? 'מתחבר...' : 'התחבר/י'}
          </button>
          {resetSent ? (
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#059669' }}>
              נשלח אימייל לאיפוס סיסמה
            </div>
          ) : (
            <button
              type="button"
              onClick={resetPassword}
              style={{
                display: 'block',
                margin: '10px auto 0',
                background: 'none',
                border: 'none',
                color: '#1A8A7D',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              שכחתי סיסמה
            </button>
          )}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #E8E5DE',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>נרשמת דרך טופס גוגל?</div>
            <Link
              to="/form-claim"
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: '#F0F7F6',
                color: '#1A8A7D',
                border: '1px solid #1A8A7D',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              נרשמת בטופס? הפעל חשבון
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
