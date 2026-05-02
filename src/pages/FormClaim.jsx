import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { s, Header, FieldRow, StrengthBar, TEAL, NAVY } from '../components/shared';
import { migrateLegacyCategory } from '../utils/categories';
import { useT } from '../i18n';

function parseContact(contact, contactType) {
  const result = { phone: '', li: '', website: '', email: '' };
  if (!contact) return result;
  const c = contact.trim();
  const type = (contactType || '').trim();

  // Always try to extract LinkedIn URL from any contact field
  const liMatch = c.match(/(https?:\/\/[^\s,;]*linkedin[^\s,;]*)/i);
  if (liMatch) result.li = liMatch[1];

  if (type.includes('אימייל') || type.includes('email')) {
    result.email = c;
  } else if (type.includes('WhatsApp') || type.includes('וואטסאפ')) {
    const waMatch = c.match(/wa\.me\/\+?(\d+)/);
    if (waMatch) result.phone = '+' + waMatch[1];
    else {
      const nums = c.replace(/[^\d]/g, '');
      if (nums.length >= 7) result.phone = '+' + nums;
    }
  } else if (type.includes('טלפון') || type.includes('phone')) {
    const nums = c.replace(/[^\d+]/g, '').replace(/^\+?/, '+');
    if (nums.length >= 7) result.phone = nums;
  } else if (type.includes('אתר') || type.includes('website')) {
    const urlMatch = c.match(/(https?:\/\/[^\s,;]+)/i);
    if (urlMatch) result.website = urlMatch[1];
    else if (c.includes('.')) result.website = 'https://' + c.split(/[\s,;]/)[0];
  }

  // Extract phone from mixed fields (e.g. "0525318894 ; linkedin...")
  if (!result.phone) {
    const phoneMatch = c.match(/(?:^|[\s,;])(\+?\d[\d\s-]{6,14}\d)(?:$|[\s,;])/);
    if (phoneMatch) {
      const nums = phoneMatch[1].replace(/[\s-]/g, '');
      result.phone = nums.startsWith('+') ? nums : '+' + nums;
    }
  }

  return result;
}

function mapCategories(mainField, subField) {
  const cats = [];
  const seen = new Set();
  const push = (raw) => {
    if (!raw || raw === 'אחר') return;
    const next = migrateLegacyCategory(raw);
    if (next && !seen.has(next)) {
      seen.add(next);
      cats.push(next);
    }
  };
  push(mainField);
  push(subField);
  return cats.slice(0, 6);
}

export { parseContact, mapCategories };

export default function FormClaim() {
  const { t } = useT();
  const [registrants, setRegistrants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalErr, setGlobalErr] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await db.getDocs('formRegistrants', [
          { field: 'claimed', op: 'EQUAL', value: false },
        ]);
        if (!cancelled) setRegistrants(docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (_e) {
        /* empty */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const results =
    search.trim().length >= 2
      ? registrants.filter((r) => (r.fullName || '').toLowerCase().includes(search.toLowerCase()))
      : [];

  async function claim() {
    const errs = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
      errs.email = t('auth.formClaim.errors.invalidEmail');
    if (pass.length < 8) errs.pass = t('auth.formClaim.errors.passwordTooShort');
    if (pass !== pass2) errs.pass2 = t('auth.formClaim.errors.passwordMismatch');
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    setGlobalErr('');
    try {
      const r = selected;
      const nameParts = (r.fullName || '').trim().split(/\s+/);
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || '';
      const contactInfo = parseContact(r.contact, r.contactType);
      const categories = mapCategories(r.mainField, r.subField);
      const needsParts = [r.seeking, r.specificNeed].filter(Boolean);

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const uid = cred.user.uid;
      const phone = contactInfo.phone || '';

      if (phone) {
        const phoneSnap = await db.getDoc('phoneIndex', phone);
        if (phoneSnap.exists()) {
          await cred.user.delete();
          setGlobalErr(t('auth.formClaim.errors.phoneTaken'));
          setSubmitting(false);
          return;
        }
      }

      let li = contactInfo.li || '';
      if (li && !li.startsWith('http')) li = 'https://' + li;
      let website = contactInfo.website || '';
      if (website && !website.startsWith('http')) website = 'https://' + website;

      await db.setDoc('users', uid, {
        first,
        last,
        phone,
        email: email.trim(),
        city: r.location || '',
        categories,
        domain: categories.join(', '),
        li,
        website,
        does: r.whatTheyDo || '',
        needs: needsParts.join('\n'),
        strength: r.strength || '',
        canHelpWith: r.canHelpWith || '',
        status: 'pending',
        role: 'member',
        source: 'google-form',
        createdAt: new Date().toISOString(),
        visibility: { phone: true, city: true, li: true, website: true, does: true, needs: true },
      });
      if (phone) await db.setDoc('phoneIndex', phone, { uid });

      await db.updateDoc('formRegistrants', r.id, {
        claimed: true,
        claimedBy: uid,
        claimedAt: new Date().toISOString(),
      });

      setDone(true);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use')
        setGlobalErr(t('auth.formClaim.errors.emailTaken'));
      else setGlobalErr(t('auth.formClaim.errors.errorPrefix', { message: e.message }));
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={s.wrap}>
        <Header />
        <div style={s.body}>
          <div style={{ ...s.card, textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#x2705;</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1C2638', marginBottom: 12 }}>
              {t('auth.formClaim.doneTitle')}
            </div>
            <div style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginBottom: 24 }}>
              {t('auth.formClaim.doneBody')}
            </div>
            <Link
              to="/"
              style={{
                ...s.btnPrimary,
                textDecoration: 'none',
                display: 'inline-block',
                padding: '10px 32px',
                width: 'auto',
              }}
            >
              {t('auth.formClaim.doneEnter')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <Header>
        <Link
          to="/login"
          style={{ ...s.btnSolid, textDecoration: 'none', display: 'inline-block' }}
        >
          {t('auth.formClaim.backToLogin')}
        </Link>
      </Header>
      <div style={{ ...s.body, maxWidth: 500 }}>
        {!selected ? (
          <div style={s.card}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#222' }}>
                {t('auth.formClaim.title')}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                {t('auth.formClaim.subtitle')}
              </div>
            </div>

            <FieldRow label={t('auth.formClaim.fullNameLabel')}>
              <input
                style={s.input}
                dir="auto"
                placeholder={t('auth.formClaim.fullNamePlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </FieldRow>

            {loading && (
              <div style={{ textAlign: 'center', color: '#888', padding: '1rem' }}>
                {t('auth.formClaim.loading')}
              </div>
            )}

            {!loading && search.trim().length >= 2 && results.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', padding: '1rem', fontSize: 14 }}>
                {t('auth.formClaim.noResultsPrefix')}{' '}
                <Link to="/register" style={{ color: TEAL }}>
                  {t('auth.formClaim.noResultsRegisterLink')}
                </Link>
              </div>
            )}

            {results.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '12px 14px',
                  border: '1px solid #E8E5DE',
                  borderRadius: 10,
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onClick={() => setSelected(r)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = TEAL)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E8E5DE')}
              >
                <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{r.fullName}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {r.location || ''}
                  {r.location && r.mainField ? ' · ' : ''}
                  {r.mainField || ''}
                </div>
                {r.whatTheyDo && (
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                    {r.whatTheyDo.slice(0, 80)}
                    {r.whatTheyDo.length > 80 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={s.card}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#222' }}>
                {t('auth.formClaim.verifyTitle')}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                {t('auth.formClaim.verifySubtitle')}
              </div>
            </div>

            <div
              style={{
                background: '#f9f9f7',
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
                {selected.fullName}
              </div>
              {selected.location && (
                <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                  {selected.location}
                </div>
              )}
              {selected.whatTheyDo && (
                <div style={{ fontSize: 13, color: '#555', marginBottom: 4, lineHeight: 1.6 }}>
                  <span style={{ color: '#888' }}>{t('auth.formClaim.doesPrefix')}</span>
                  {selected.whatTheyDo}
                </div>
              )}
              {selected.seeking && (
                <div style={{ fontSize: 13, color: '#555' }}>
                  <span style={{ color: '#888' }}>{t('auth.formClaim.seekingPrefix')}</span>
                  {selected.seeking}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSelected(null);
                setGlobalErr('');
                setErrors({});
              }}
              style={{
                background: 'none',
                border: 'none',
                color: TEAL,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
                marginBottom: 12,
                display: 'block',
              }}
            >
              {t('auth.formClaim.notMe')}
            </button>

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

            <div style={s.sectionTitle}>{t('auth.formClaim.sectionLogin')}</div>
            <FieldRow label={t('auth.formClaim.emailLabel')}>
              <input
                style={s.input}
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <div style={s.err}>{errors.email}</div>}
            </FieldRow>
            <FieldRow label={t('auth.formClaim.passwordLabel')}>
              <input
                style={s.input}
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <StrengthBar password={pass} />
              {errors.pass && <div style={s.err}>{errors.pass}</div>}
            </FieldRow>
            <FieldRow label={t('auth.formClaim.passwordConfirmLabel')}>
              <input
                style={s.input}
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
              />
              {errors.pass2 && <div style={s.err}>{errors.pass2}</div>}
            </FieldRow>

            <button
              style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1 }}
              onClick={claim}
              disabled={submitting}
            >
              {submitting ? t('auth.formClaim.submitting') : t('auth.formClaim.submit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
