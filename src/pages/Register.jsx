import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { s, Header, FieldRow, StrengthBar, BLUE, TEAL } from '../components/shared';
import CategoryPicker from '../components/CategoryPicker';

const COUNTRY_CODES = [
  { code: '+972', flag: '🇮🇱', name: 'ישראל' },
  { code: '+1', flag: '🇺🇸', name: 'ארה״ב / קנדה' },
  { code: '+44', flag: '🇬🇧', name: 'בריטניה' },
  { code: '+49', flag: '🇩🇪', name: 'גרמניה' },
  { code: '+33', flag: '🇫🇷', name: 'צרפת' },
  { code: '+39', flag: '🇮🇹', name: 'איטליה' },
  { code: '+34', flag: '🇪🇸', name: 'ספרד' },
  { code: '+351', flag: '🇵🇹', name: 'פורטוגל' },
  { code: '+31', flag: '🇳🇱', name: 'הולנד' },
  { code: '+41', flag: '🇨🇭', name: 'שווייץ' },
  { code: '+43', flag: '🇦🇹', name: 'אוסטריה' },
  { code: '+32', flag: '🇧🇪', name: 'בלגיה' },
  { code: '+46', flag: '🇸🇪', name: 'שוודיה' },
  { code: '+47', flag: '🇳🇴', name: 'נורווגיה' },
  { code: '+45', flag: '🇩🇰', name: 'דנמרק' },
  { code: '+48', flag: '🇵🇱', name: 'פולין' },
  { code: '+380', flag: '🇺🇦', name: 'אוקראינה' },
  { code: '+7', flag: '🇷🇺', name: 'רוסיה' },
  { code: '+61', flag: '🇦🇺', name: 'אוסטרליה' },
  { code: '+55', flag: '🇧🇷', name: 'ברזיל' },
  { code: '+52', flag: '🇲🇽', name: 'מקסיקו' },
  { code: '+54', flag: '🇦🇷', name: 'ארגנטינה' },
  { code: '+27', flag: '🇿🇦', name: 'דרום אפריקה' },
  { code: '+91', flag: '🇮🇳', name: 'הודו' },
  { code: '+90', flag: '🇹🇷', name: 'טורקיה' },
  { code: '+971', flag: '🇦🇪', name: 'איחוד האמירויות' },
  { code: '+966', flag: '🇸🇦', name: 'סעודיה' },
  { code: '+20', flag: '🇪🇬', name: 'מצרים' },
  { code: '+212', flag: '🇲🇦', name: 'מרוקו' },
  { code: '+216', flag: '🇹🇳', name: 'תוניסיה' },
  { code: '+81', flag: '🇯🇵', name: 'יפן' },
  { code: '+82', flag: '🇰🇷', name: 'דרום קוריאה' },
  { code: '+86', flag: '🇨🇳', name: 'סין' },
  { code: '+65', flag: '🇸🇬', name: 'סינגפור' },
  { code: '+852', flag: '🇭🇰', name: 'הונג קונג' },
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [refCode, setRefCode] = useState(null);
  const [refName, setRefName] = useState(null);
  const [form, setForm] = useState({
    first: '',
    last: '',
    countryCode: '+972',
    phoneNum: '',
    email: '',
    city: '',
    categories: [],
    li: '',
    website: '',
    does: '',
    needs: '',
    strength: '',
    canHelpWith: '',
    pass: '',
    pass2: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadRules() {
      const snap = await db.getDoc('settings', 'houseRules');
      if (snap.exists()) setRulesText(snap.data().text || '');
    }
    loadRules();
  }, []);

  // Capture referral code from URL (?ref=XXX) or sessionStorage
  useEffect(() => {
    const urlRef = searchParams.get('ref');
    let candidate = null;
    if (urlRef && urlRef.length >= 10 && urlRef.length <= 50) {
      candidate = urlRef;
      try {
        sessionStorage.setItem('bayit_ref', urlRef);
      } catch (_) {
        /* sessionStorage may be unavailable — best effort */
      }
    } else {
      try {
        const stored = sessionStorage.getItem('bayit_ref');
        if (stored && stored.length >= 10 && stored.length <= 50) {
          candidate = stored;
        }
      } catch (_) {
        /* sessionStorage may be unavailable — best effort */
      }
    }
    if (candidate) {
      setRefCode(candidate);
      // Optional: try to look up referrer name; failure must not block registration
      (async () => {
        try {
          const snap = await db.getDoc('users', candidate);
          if (snap.exists()) {
            const data = snap.data() || {};
            const name = `${data.first || ''} ${data.last || ''}`.trim();
            if (name) setRefName(name);
          }
        } catch (_) {
          /* ignore — fall back to generic banner */
        }
      })();
    }
  }, [searchParams]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const errs = {};
    if (!form.first.trim()) errs.first = 'שדה חובה';
    if (!form.last.trim()) errs.last = 'שדה חובה';
    if (!/^\d{5,15}$/.test(form.phoneNum.trim()))
      errs.phone = 'יש להזין מספר טלפון תקין (ספרות בלבד)';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'אימייל לא תקין';
    if (form.pass.length < 8) errs.pass = 'לפחות 8 תווים';
    if (form.pass !== form.pass2) errs.pass2 = 'הסיסמאות אינן תואמות';
    if (rulesText && !rulesAccepted) errs.rules = 'יש לאשר את חוקי הבית';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setGlobalErr('');
    let createdUser = null;
    try {
      const phoneId = form.countryCode + form.phoneNum.trim();

      // Create auth user FIRST so we have a token for Firestore calls
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.pass);
      createdUser = cred.user;
      const uid = cred.user.uid;

      // Now check phone uniqueness (authenticated)
      const phoneSnap = await db.getDoc('phoneIndex', phoneId);
      if (phoneSnap.exists()) {
        throw new Error('PHONE_TAKEN');
      }

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
        strength: form.strength.trim(),
        canHelpWith: form.canHelpWith.trim(),
        status: 'pending',
        role: 'member',
        createdAt: new Date().toISOString(),
        visibility: { phone: true, city: true, li: true, website: true, does: true, needs: true },
      };

      await db.setDoc('users', uid, userData);
      await db.setDoc('phoneIndex', phoneId, { uid });

      // Fire-and-forget: track referral if a ref code is set. Must not block registration.
      if (refCode) {
        try {
          const idToken = await auth.currentUser.getIdToken();
          fetch('/api/track-referral', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ referrerUid: refCode }),
          })
            .then(async (res) => {
              try {
                const data = await res.json();
                if (!data.ok) {
                  console.log('[track-referral] no-op:', data.reason);
                }
              } catch (_) {
                /* ignore parse errors */
              }
            })
            .catch((err) => {
              console.log('[track-referral] failed:', err?.message || err);
            });
        } catch (err) {
          console.log('[track-referral] token error:', err?.message || err);
        } finally {
          try {
            sessionStorage.removeItem('bayit_ref');
          } catch (_) {
            /* best effort */
          }
        }
      }

      createdUser = null; // success — don't cleanup
      setSubmitted(true);
    } catch (e) {
      if (createdUser) {
        try {
          await createdUser.delete();
        } catch (_) {
          /* cleanup best-effort */
        }
      }
      if (e.message === 'PHONE_TAKEN') {
        setErrors({ phone: 'מספר זה כבר רשום' });
      } else if (e.code === 'auth/email-already-in-use') {
        setGlobalErr('אימייל זה כבר רשום במערכת');
      } else {
        setGlobalErr('שגיאה: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      {submitted && (
        <div>
          <Header />
          <div style={s.body}>
            <div style={{ ...s.card, textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2705;</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1C2638', marginBottom: 12 }}>
                בקשת ההצטרפות התקבלה!
              </div>
              <div style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginBottom: 24 }}>
                הבקשה הועברה למנהלי הקהילה ותאושר בקרוב.
                <br />
                נא להמתין בסבלנות — תקבל/י הודעה כשהחשבון יאושר.
              </div>
              <Link
                to="/login"
                style={{
                  ...s.btnPrimary,
                  textDecoration: 'none',
                  display: 'inline-block',
                  padding: '10px 32px',
                  width: 'auto',
                }}
              >
                למסך ההתחברות
              </Link>
            </div>
          </div>
        </div>
      )}
      {!submitted && showRules && (
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

      {!submitted && (
        <Header>
          <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)' }}>כבר רשום?</span>
          <Link
            to="/login"
            style={{ ...s.btnSolid, textDecoration: 'none', display: 'inline-block' }}
          >
            התחברות
          </Link>
        </Header>
      )}
      {!submitted && (
        <div style={s.body}>
          <div style={s.card}>
            {refCode && (
              <div
                style={{
                  background: '#E8F4F2',
                  color: TEAL,
                  border: `1px solid ${TEAL}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {refName ? `🤝 הוזמנת ע"י ${refName}` : '🤝 הוזמנת ע"י חבר מהקהילה!'}
              </div>
            )}
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
            <FieldRow label="טלפון * (מזהה ייחודי)">
              <div style={{ display: 'flex', gap: 8, direction: 'ltr' }}>
                <select
                  value={form.countryCode}
                  onChange={(e) => set('countryCode', e.target.value)}
                  style={{
                    ...s.input,
                    width: 150,
                    flexShrink: 0,
                    cursor: 'pointer',
                    appearance: 'auto',
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} {c.name}
                    </option>
                  ))}
                </select>
                <input
                  style={s.input}
                  placeholder="501234567"
                  dir="ltr"
                  value={form.phoneNum}
                  onChange={(e) => set('phoneNum', e.target.value.replace(/\D/g, ''))}
                />
              </div>
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
            <FieldRow label="החוזקות שלי">
              <textarea
                style={s.textarea}
                dir="auto"
                value={form.strength}
                onChange={(e) => set('strength', e.target.value)}
                placeholder="מה הכוח שלך? ניסיון, ידע, יכולות מיוחדות..."
              />
            </FieldRow>
            <FieldRow label="במה אני יכול לעזור לאחרים">
              <textarea
                style={s.textarea}
                dir="auto"
                value={form.canHelpWith}
                onChange={(e) => set('canHelpWith', e.target.value)}
                placeholder="ייעוץ, קשרים, ידע מקצועי..."
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
      )}
    </div>
  );
}
