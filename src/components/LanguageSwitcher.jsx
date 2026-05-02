import { useT } from '../i18n';
import { CREAM } from './shared';

/**
 * Two-state language toggle: עברית / English.
 * Inactive label is muted, active is gold-bordered. Compact enough to sit
 * inline next to the user greeting, and wraps cleanly in the mobile menu.
 */
export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, t } = useT();

  const baseBtn = {
    background: 'transparent',
    color: 'rgba(245,237,224,0.65)',
    border: '1px solid rgba(212,163,74,0.25)',
    padding: compact ? '3px 8px' : '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
    lineHeight: 1.2,
  };
  const activeBtn = {
    background: 'rgba(212,163,74,0.18)',
    color: CREAM,
    borderColor: 'rgba(212,163,74,0.6)',
    fontWeight: 600,
  };

  const heStyle = {
    ...baseBtn,
    borderRadius: '6px 0 0 6px',
    borderRight: 'none',
    ...(lang === 'he' ? activeBtn : {}),
  };
  const enStyle = {
    ...baseBtn,
    borderRadius: '0 6px 6px 0',
    ...(lang === 'en' ? activeBtn : {}),
  };

  return (
    <div
      role="group"
      aria-label={t('lang.switch')}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <button
        type="button"
        onClick={() => setLang('he')}
        aria-pressed={lang === 'he'}
        style={heStyle}
      >
        {t('lang.he')}
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        style={enStyle}
      >
        {t('lang.en')}
      </button>
    </div>
  );
}
