import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { s, Header, FieldRow, StrengthBar, BLUE } from '../components/shared';
import CategoryPicker from '../components/CategoryPicker';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first: '',
    last: '',
    phone: '',
    email: '',
    city: '',
    categories: [],
    li: '',
    website: '',
    does: '',
    needs: '',
    pass: '',
    pass2: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    async function loadRules() {
      const snap = await db.getDoc('settings', 'houseRules');
      if (snap.exists()) setRulesText(snap.data().text || '');
    }
    loadRules();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const errs = {};
    if (!form.first.trim()) errs.first = 'שדה חובה';
    if (!form.last.trim()) errs.last = 'שדה חובה';
    if (!/^\+\d{7,15}$/.test(form.phone.trim())) errs.phone = 'פורמט: +972501234567';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'אימייל לא תקין';
    if (form.pass.length < 8) errs.pass = 'לפחות 8 תווים';
    if (form.pass !== form.pass2) errs.pass2 = 'הסיסמאות אינן תואמות';
    if (rulesText && !rulesAccepted) errs.rules = 'יש לאשר את חוקי הבית';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setGlobalErr('');
    try {
      const phoneId = form.phone.trim();
      const phoneSnap = await db.getDoc('phoneIndex', phoneId);
      if (phoneSnap.exists()) {
        setErrors({ phone: 'מספר זה כבר רשום' });
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.pass);
      const uid = cred.user.uid;
      let website = form.website.trim();
      if (website && !website.startsWith('http')) website = 'https://' + website;

      let li = form.li.trim();
      if (li && !li.startsWith('http')) li = 'https://' + li;

      const userData = {
        first: form.first.trim(),
        last: form.last.trim(),
        phone: phoneId,
        email: form.email.trim(),
        city: form.city.trim(),
        categories: form.categories,
        domain: form.categories.join(', '),
        li,
        website,
        does: form.does.trim(),
        needs: form.needs.trim(),
        status: 'pending',
        role: 'member',
        createdAt: new Date().toISOString(),
        visibility: { phone: true, city: true, li: true, website: true, does: true, needs: true },
      };

      await db.setDoc('users', uid, userData);
      await db.setDoc('phoneIndex', phoneId, { uid });
      // Auth state change will pick up the new user via AuthContext
      // navigate to login so the user can log in fresh, or if admin auto-redirects
      navigate('/login');
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') setGlobalErr('אימייל זה כבר רשום במערכת');
      else setGlobalErr('שגיאה: ' + e.message);
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      {showRules && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowRules(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '1.5rem',
              width: '100%',
              maxWidth: 500,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: '1rem' }}>חוקי הבית</div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: '#333',
                whiteSpace: 'pre-wrap',
                direction: 'auto',
              }}
            >
              {rulesText}
            </div>
            <button
              onClick={() => setShowRules(false)}
              style={{
                marginTop: '1.25rem',
                width: '100%',
                padding: 10,
                background: BLUE,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              סגור
            </button>
          </div>
        </div>
      )}

      <Header>
        <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)' }}>כבר רשום?</span>
        <Link
          to="/login"
          style={{ ...s.btnSolid, textDecoration: 'none', display: 'inline-block' }}
        >
          התחברות
        </Link>
      </Header>
      <div style={s.body}>
        <div style={s.card}>
          {globalErr && (
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
              {globalErr}
            </div>
          )}

          <div style={s.sectionTitle}>פרטים אישיים</div>
          <div style={s.twoCol}>
            <FieldRow label="שם פרטי *">
              <input
                style={s.input}
                dir="auto"
                value={form.first}
                onChange={(e) => set('first', e.target.value)}
              />
              {errors.first && <div style={s.err}>{errors.first}</div>}
            </FieldRow>
            <FieldRow label="שם משפחה *">
              <input
                style={s.input}
                dir="auto"
                value={form.last}
                onChange={(e) => set('last', e.target.value)}
              />
              {errors.last && <div style={s.err}>{errors.last}</div>}
            </FieldRow>
          </div>
          <FieldRow label="טלפון + קידומת מדינה * (מזהה ייחודי)">
            <input
              style={s.input}
              placeholder="+972501234567"
              dir="ltr"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
            {errors.phone && <div style={s.err}>{errors.phone}</div>}
          </FieldRow>
          <FieldRow label="עיר מגורים">
            <input
              style={s.input}
              dir="auto"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </FieldRow>
          <FieldRow label="לינקדין">
            <input
              style={s.input}
              placeholder="https://linkedin.com/in/..."
              dir="ltr"
              value={form.li}
              onChange={(e) => set('li', e.target.value)}
            />
          </FieldRow>
          <FieldRow label="אתר אינטרנט">
            <input
              style={s.input}
              placeholder="https://yourwebsite.com"
              dir="ltr"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
            />
          </FieldRow>

          <div style={s.sectionTitle}>תחומי עיסוק (עד 4)</div>
          <CategoryPicker value={form.categories} onChange={(v) => set('categories', v)} />

          <div style={s.sectionTitle}>פרופיל מקצועי</div>
          <FieldRow label="מה אני עושה">
            <textarea
              style={s.textarea}
              dir="auto"
              value={form.does}
              onChange={(e) => set('does', e.target.value)}
              placeholder="תאר/י את הפרויקט שלך..."
            />
          </FieldRow>
          <FieldRow label="מה אני מחפש / צריך">
            <textarea
              style={s.textarea}
              dir="auto"
              value={form.needs}
              onChange={(e) => set('needs', e.target.value)}
              placeholder="שותף, משקיע, לקוחות..."
            />
          </FieldRow>

          <div style={s.sectionTitle}>פרטי כניסה</div>
          <FieldRow label="אימייל *">
            <input
              style={s.input}
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <div style={s.err}>{errors.email}</div>}
          </FieldRow>
          <FieldRow label="סיסמא * (לפחות 8 תווים)">
            <input
              style={s.input}
              type="password"
              value={form.pass}
              onChange={(e) => set('pass', e.target.value)}
            />
            <StrengthBar password={form.pass} />
            {errors.pass && <div style={s.err}>{errors.pass}</div>}
          </FieldRow>
          <FieldRow label="אימות סיסמא *">
            <input
              style={s.input}
              type="password"
              value={form.pass2}
              onChange={(e) => set('pass2', e.target.value)}
            />
            {errors.pass2 && <div style={s.err}>{errors.pass2}</div>}
          </FieldRow>

          {rulesText && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 14px',
                background: '#f9f9f7',
                borderRadius: 8,
                border: '1px solid #E8E5DE',
              }}
            >
              <label
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                  קראתי ואני מסכים/ה ל
                  <button
                    onClick={() => setShowRules(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: BLUE,
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '0 2px',
                      textDecoration: 'underline',
                    }}
                  >
                    חוקי הבית
                  </button>
                </span>
              </label>
              {errors.rules && <div style={{ ...s.err, marginTop: 6 }}>{errors.rules}</div>}
            </div>
          )}

          <button
            style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'שולח...' : 'הגש בקשת הצטרפות'}
          </button>
          <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 10 }}>
            לאחר ההגשה, הפרופיל ממתין לאישור מנהל
          </p>
        </div>
      </div>
    </div>
  );
}
