import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, FieldRow } from '../components/shared';
import CategoryPicker from '../components/CategoryPicker';
import BadgeDisplay from '../components/BadgeDisplay';
import ScoreCube from '../components/ScoreCube';
import ReferralsList from '../components/ReferralsList';
import { useT } from '../i18n';

const VISIBILITY_KEYS = ['phone', 'city', 'li', 'website', 'does', 'needs'];

const defaultVisibility = Object.fromEntries(VISIBILITY_KEYS.map((k) => [k, true]));

function VisibilityToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: checked ? '#1A8A7D' : '#ccc',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          transition: 'right 0.2s, left 0.2s',
          ...(checked ? { left: 2, right: 'auto' } : { right: 2, left: 'auto' }),
        }}
      />
    </button>
  );
}

export default function EditProfile() {
  const { t } = useT();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first: user?.first || '',
    last: user?.last || '',
    city: user?.city || '',
    categories: user?.categories || [],
    li: user?.li || '',
    website: user?.website || '',
    does: user?.does || '',
    needs: user?.needs || '',
    strength: user?.strength || '',
    canHelpWith: user?.canHelpWith || '',
  });
  const [visibility, setVisibility] = useState({ ...defaultVisibility, ...user?.visibility });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first: user.first || '',
        last: user.last || '',
        city: user.city || '',
        categories: user.categories || [],
        li: user.li || '',
        website: user.website || '',
        does: user.does || '',
        needs: user.needs || '',
        strength: user.strength || '',
        canHelpWith: user.canHelpWith || '',
      });
      setVisibility({ ...defaultVisibility, ...user.visibility });
    }
  }, [user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.first.trim() || !form.last.trim()) {
      setErr(t('members.editProfile.validation.nameRequired'));
      return;
    }
    setLoading(true);
    setErr('');
    try {
      let website = form.website.trim();
      if (website && !website.startsWith('http')) website = 'https://' + website;

      let li = form.li.trim();
      if (li && !li.startsWith('http')) li = 'https://' + li;

      await db.updateDoc('users', user.uid, {
        first: form.first.trim(),
        last: form.last.trim(),
        city: form.city.trim(),
        categories: form.categories,
        domain: form.categories.join(', '),
        li,
        website,
        does: form.does.trim(),
        needs: form.needs.trim(),
        strength: form.strength.trim(),
        canHelpWith: form.canHelpWith.trim(),
        visibility,
      });
      setSuccess(true);
      await refreshUser();
      navigate('/');
    } catch (e) {
      setErr(t('members.editProfile.validation.saveError', { message: e.message }));
    }
    setLoading(false);
  }

  async function requestDelete() {
    if (!window.confirm(t('members.editProfile.deleteConfirm'))) return;
    try {
      await db.updateDoc('users', user.uid, { deleteRequest: true });
      alert(t('members.editProfile.deleteRequestSent'));
    } catch (_e) {
      setErr(t('members.editProfile.validation.deleteRequestError'));
    }
  }

  if (!user) return null;

  return (
    <div style={{ ...s.body }}>
      <div style={s.card}>
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
        {success && (
          <div
            style={{
              background: '#EAF3DE',
              color: '#27500A',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 14,
              fontSize: 13,
            }}
          >
            {t('members.editProfile.success')}
          </div>
        )}

        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#333',
            margin: '4px 0 10px',
          }}
        >
          {t('members.editProfile.score')}
        </h3>
        <div style={{ marginBottom: 18 }}>
          <ScoreCube />
        </div>

        <div style={{ marginTop: 16 }}>
          <ReferralsList />
        </div>

        <div style={s.sectionTitle}>{t('members.editProfile.sections.personal')}</div>
        <div style={s.twoCol}>
          <FieldRow label={t('members.editProfile.fields.first')}>
            <input
              style={s.input}
              dir="auto"
              value={form.first}
              onChange={(e) => set('first', e.target.value)}
            />
          </FieldRow>
          <FieldRow label={t('members.editProfile.fields.last')}>
            <input
              style={s.input}
              dir="auto"
              value={form.last}
              onChange={(e) => set('last', e.target.value)}
            />
          </FieldRow>
        </div>
        <FieldRow label={t('members.editProfile.fields.city')}>
          <input
            style={s.input}
            dir="auto"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
          />
        </FieldRow>
        <FieldRow label={t('members.editProfile.fields.li')}>
          <input
            style={s.input}
            placeholder="https://linkedin.com/in/..."
            dir="ltr"
            value={form.li}
            onChange={(e) => set('li', e.target.value)}
          />
        </FieldRow>
        <FieldRow label={t('members.editProfile.fields.website')}>
          <input
            style={s.input}
            placeholder="https://yourwebsite.com"
            dir="ltr"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
          />
        </FieldRow>

        <div style={s.sectionTitle}>{t('members.editProfile.sections.categories')}</div>
        <CategoryPicker value={form.categories} onChange={(v) => set('categories', v)} />

        <div style={s.sectionTitle}>{t('members.editProfile.sections.professional')}</div>
        <FieldRow label={t('members.editProfile.fields.does')}>
          <textarea
            style={s.textarea}
            dir="auto"
            value={form.does}
            onChange={(e) => set('does', e.target.value)}
          />
        </FieldRow>
        <FieldRow label={t('members.editProfile.fields.needs')}>
          <textarea
            style={s.textarea}
            dir="auto"
            value={form.needs}
            onChange={(e) => set('needs', e.target.value)}
          />
        </FieldRow>
        <FieldRow label={t('members.editProfile.fields.strength')}>
          <textarea
            style={s.textarea}
            dir="auto"
            value={form.strength}
            onChange={(e) => set('strength', e.target.value)}
            placeholder={t('members.editProfile.placeholders.strength')}
          />
        </FieldRow>
        <FieldRow label={t('members.editProfile.fields.canHelpWith')}>
          <textarea
            style={s.textarea}
            dir="auto"
            value={form.canHelpWith}
            onChange={(e) => set('canHelpWith', e.target.value)}
            placeholder={t('members.editProfile.placeholders.canHelpWith')}
          />
        </FieldRow>

        {user.badges?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={s.sectionTitle}>{t('members.editProfile.sections.badges')}</div>
            <BadgeDisplay badges={user.badges} size="md" />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
              {t('members.editProfile.badgesNote')}
            </div>
          </div>
        )}

        <div style={s.sectionTitle}>{t('members.editProfile.sections.privacy')}</div>
        <div
          style={{
            fontSize: 12,
            color: '#888',
            marginBottom: 10,
            lineHeight: 1.6,
          }}
        >
          {t('members.editProfile.visibility.intro')}
        </div>
        <div
          style={{
            background: '#f9f9f7',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 16,
          }}
        >
          {VISIBILITY_KEYS.map((key) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '0.5px solid #eee',
              }}
            >
              <span style={{ fontSize: 13, color: '#333' }}>
                {t(`members.editProfile.visibility.${key}`)}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#aaa' }}>
                  {visibility[key]
                    ? t('members.editProfile.visibility.visible')
                    : t('members.editProfile.visibility.hidden')}
                </span>
                <VisibilityToggle
                  checked={visibility[key]}
                  onChange={() => setVisibility((v) => ({ ...v, [key]: !v[key] }))}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          {t('members.editProfile.phoneEmailNote')}
        </div>
        <div style={s.twoCol}>
          <div
            style={{
              padding: '8px 10px',
              background: '#f5f5f3',
              borderRadius: 8,
              fontSize: 13,
              color: '#888',
              direction: 'ltr',
            }}
          >
            {user.phone}
          </div>
          <div
            style={{
              padding: '8px 10px',
              background: '#f5f5f3',
              borderRadius: 8,
              fontSize: 13,
              color: '#888',
            }}
          >
            {user.email}
          </div>
        </div>

        <button
          style={{ ...s.btnPrimary, marginTop: 16, opacity: loading ? 0.7 : 1 }}
          onClick={save}
          disabled={loading}
        >
          {loading ? t('members.editProfile.saving') : t('members.editProfile.saveChanges')}
        </button>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '0.5px solid #eee' }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
            {t('members.editProfile.deleteProfile')}
          </div>
          <button
            onClick={requestDelete}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: '#A32D2D',
              border: '0.5px solid #F09595',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t('members.editProfile.requestDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}
