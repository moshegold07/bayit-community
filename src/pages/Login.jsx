import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, Header, FieldRow } from '../components/shared';
import { useT } from '../i18n';

export default function Login() {
  const { refreshUser } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function resetPassword() {
    setErr('');
    if (!email.trim()) {
      setErr(t('auth.login.resetEmailRequired'));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (_e) {
      setErr(t('auth.login.resetError'));
    }
  }

  async function login() {
    setErr('');
    if (!email || !pass) {
      setErr(t('auth.login.missingFields'));
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
        setErr(t('auth.login.invalidCredentials'));
      else setErr(t('auth.login.errorPrefix', { message: e.message }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <Header>
        <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)' }}>
          {t('auth.login.newQuestion')}
        </span>
        <Link
          to="/register"
          style={{ ...s.btnSolid, textDecoration: 'none', display: 'inline-block' }}
        >
          {t('auth.login.joinLink')}
        </Link>
      </Header>
      <div style={{ ...s.body, maxWidth: 400 }}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#222' }}>
              {t('auth.login.title')}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              {t('auth.login.subtitle')}
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
          <FieldRow label={t('auth.login.emailLabel')}>
            <input
              style={s.input}
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
            />
          </FieldRow>
          <FieldRow label={t('auth.login.passwordLabel')}>
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
            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
          {resetSent ? (
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: '#059669' }}>
              {t('auth.login.resetSent')}
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
              {t('auth.login.forgotPassword')}
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
            <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
              {t('auth.login.formClaimQuestion')}
            </div>
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
              {t('auth.login.formClaimLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
