import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../i18n';
import { s, BLUE, BLUE_LT, NAVY, AMBER, FieldRow } from '../components/shared';
import { TAXONOMY, parentLabel } from '../utils/categories';
import { logActivity } from '../utils/activityLog';

export default function VentureForm() {
  const navigate = useNavigate();
  const { t, dir } = useT();
  const { user } = useAuth();
  const userScore = user?.score || 0;
  const isAdmin = user?.role === 'admin';
  const canCreate = isAdmin || userScore >= 10;

  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [parentKey, setParentKey] = useState('');
  const [subKey, setSubKey] = useState('');
  const [customSub, setCustomSub] = useState('');
  const [link, setLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const parent = TAXONOMY.find((p) => p.key === parentKey);
  const subs = parent?.subs || [];
  const isOther = parentKey === 'other' || parent?.allowCustom;

  function buildCategory() {
    if (!parentKey) return '';
    if (isOther && customSub.trim()) return `${parentKey}:${customSub.trim()}`;
    if (subKey) return `${parentKey}:${subKey}`;
    return '';
  }

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = t('content.ventures.form.errTitleRequired');
    else if (title.trim().length > 200) errs.title = t('content.ventures.form.errTitleMax');
    if (!story.trim()) errs.story = t('content.ventures.form.errStoryRequired');
    else if (story.trim().length > 5000) errs.story = t('content.ventures.form.errStoryMax');
    if (!parentKey) errs.category = t('content.ventures.form.errCategoryRequired');
    else if (isOther && !customSub.trim())
      errs.category = t('content.ventures.form.errCategoryCustom');
    else if (!isOther && !subKey) errs.category = t('content.ventures.form.errCategorySub');
    if (!link.trim()) errs.link = t('content.ventures.form.errLinkRequired');
    else {
      const tt = link.trim().toLowerCase();
      if (!tt.startsWith('http://') && !tt.startsWith('https://')) {
        errs.link = t('content.ventures.form.errLinkProtocol');
      }
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/claim-queue-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          story: story.trim(),
          category: buildCategory(),
          link: link.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error || t('content.ventures.form.errServerStatus', { status: res.status }),
        );
      }
      logActivity({
        type: 'venture_posted',
        actorName: `${user.first || ''} ${user.last || ''}`.trim(),
        actorUid: user.uid,
        title: title.trim(),
        link: '/ventures/' + data.id,
      });
      navigate('/ventures/' + data.id);
    } catch (err) {
      setServerError(err.message || t('content.ventures.form.errServerGeneric'));
      setSubmitting(false);
    }
  }

  if (!canCreate) {
    return (
      <LockedView
        navigate={navigate}
        userScore={userScore}
        referredCount={user?.referredCount || 0}
        uid={user?.uid}
      />
    );
  }

  return (
    <div style={s.body}>
      <button
        onClick={() => navigate('/ventures')}
        style={{
          background: 'none',
          border: 'none',
          color: BLUE,
          cursor: 'pointer',
          fontSize: 14,
          padding: 0,
          marginBottom: '1rem',
        }}
      >
        {t('content.ventures.form.back')}
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 0.25rem', color: NAVY }}>
        {t('content.ventures.form.title')}
      </h1>
      <div style={{ fontSize: 12, color: '#888', marginBottom: '1rem' }}>
        {t('content.ventures.form.subtitle')}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={s.card}>
          <FieldRow label={t('content.ventures.form.labelName')}>
            <input
              style={s.input}
              dir="auto"
              placeholder={t('content.ventures.form.placeholderName')}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <div style={s.err}>{errors.title}</div>}
          </FieldRow>

          <FieldRow label={t('content.ventures.form.labelStory')}>
            <textarea
              style={{ ...s.textarea, minHeight: 140 }}
              dir="auto"
              placeholder={t('content.ventures.form.placeholderStory')}
              maxLength={5000}
              value={story}
              onChange={(e) => setStory(e.target.value)}
            />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>{story.length}/5000</div>
            {errors.story && <div style={s.err}>{errors.story}</div>}
          </FieldRow>

          <FieldRow label={t('content.ventures.form.labelCategory')}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                style={{ ...s.input, flex: 1, minWidth: 160 }}
                dir={dir}
                value={parentKey}
                onChange={(e) => {
                  setParentKey(e.target.value);
                  setSubKey('');
                  setCustomSub('');
                }}
              >
                <option value="">{t('content.ventures.form.placeholderParent')}</option>
                {TAXONOMY.map((p) => (
                  <option key={p.key} value={p.key}>
                    {parentLabel(p.key)}
                  </option>
                ))}
              </select>
              {parentKey && !isOther && subs.length > 0 && (
                <select
                  style={{ ...s.input, flex: 1, minWidth: 160 }}
                  dir={dir}
                  value={subKey}
                  onChange={(e) => setSubKey(e.target.value)}
                >
                  <option value="">{t('content.ventures.form.placeholderSub')}</option>
                  {subs.map((sub) => (
                    <option key={sub.key} value={sub.key}>
                      {sub.label}
                    </option>
                  ))}
                </select>
              )}
              {isOther && (
                <input
                  style={{ ...s.input, flex: 1, minWidth: 160 }}
                  dir="auto"
                  placeholder={t('content.ventures.form.placeholderCustom')}
                  maxLength={50}
                  value={customSub}
                  onChange={(e) => setCustomSub(e.target.value)}
                />
              )}
            </div>
            {errors.category && <div style={s.err}>{errors.category}</div>}
          </FieldRow>

          <FieldRow label={t('content.ventures.form.labelLink')}>
            <input
              style={s.input}
              dir="ltr"
              type="url"
              placeholder={t('content.ventures.form.placeholderLink')}
              maxLength={500}
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            {errors.link && <div style={s.err}>{errors.link}</div>}
          </FieldRow>

          {serverError && (
            <div
              style={{
                background: '#FCEBEB',
                color: '#791F1F',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ ...s.btnPrimary, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? t('content.ventures.form.submitting') : t('content.ventures.form.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}

function LockedView({ navigate, userScore, referredCount, uid }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const shareLink = `bayit-community.com/r/${uid || ''}`;
  const remaining = Math.max(0, 10 - userScore);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${shareLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silent fail
    }
  }

  return (
    <div style={{ ...s.body, maxWidth: 600 }}>
      <button
        onClick={() => navigate('/ventures')}
        style={{
          background: 'none',
          border: 'none',
          color: BLUE,
          cursor: 'pointer',
          fontSize: 14,
          padding: 0,
          marginBottom: '1rem',
        }}
      >
        {t('content.ventures.locked.back')}
      </button>

      <div
        style={{
          background: '#fff',
          border: `1px solid ${BLUE_LT}`,
          borderRadius: 16,
          padding: '2rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 12, lineHeight: 1 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 0.75rem', color: NAVY }}>
          {t('content.ventures.locked.title')}
        </h1>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: '0 0 1rem' }}>
          {t('content.ventures.locked.explanation')}
        </p>

        <div
          style={{
            background: BLUE_LT,
            borderRadius: 10,
            padding: '0.75rem 1rem',
            margin: '0 0 1.25rem',
            fontSize: 13,
            color: NAVY,
          }}
        >
          {t('content.ventures.locked.scoreLine', { score: userScore, referred: referredCount })}
          {remaining > 0 && (
            <div style={{ fontSize: 12, color: AMBER, marginTop: 4 }}>
              {t('content.ventures.locked.missingMembers', { remaining })}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
          {t('content.ventures.locked.yourLink')}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <input
            readOnly
            value={shareLink}
            dir="ltr"
            style={{ ...s.input, flex: 1, minWidth: 200, fontSize: 12 }}
          />
          <button
            type="button"
            onClick={copyLink}
            style={{ ...s.btnPrimary, padding: '8px 16px', whiteSpace: 'nowrap' }}
          >
            {copied ? t('content.ventures.locked.copied') : t('content.ventures.locked.copyLink')}
          </button>
        </div>
      </div>
    </div>
  );
}
