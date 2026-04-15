import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { s, Header, FieldRow } from '../components/shared';

export default function Login({ onRegister, onSuccess }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    setErr('');
    if (!email || !pass) {
      setErr('יש למלא אימייל וסיסמא');
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const snap = await db.getDoc('users', cred.user.uid);
      if (!snap.exists()) {
        setErr('משתמש לא נמצא');
        setLoading(false);
        return;
      }
      onSuccess({ uid: cred.user.uid, ...snap.data() });
    } catch (e) {
      if (
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/user-not-found'
      )
        setErr('אימייל או סיסמא שגויים');
      else setErr('שגיאה: ' + e.message);
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <Header>
        <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)' }}>חדש?</span>
        <button style={s.btnSolid} onClick={onRegister}>
          הצטרפות
        </button>
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
        </div>
      </div>
    </div>
  );
}
