import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * i18n module — minimal custom solution (no external deps).
 *
 * Auto-loads every JSON file under ./he/ and ./en/ via Vite's import.meta.glob.
 * Each language folder must contain JSON files whose top-level keys are unique
 * across the entire folder. Conventions:
 *   - common.json  → namespaces: common.*, nav.*, lang.*
 *   - auth.json    → namespaces: auth.*
 *   - members.json → namespaces: members.*
 *   - content.json → namespaces: content.*
 *
 * If two files in the same language define the same top-level key, the later
 * file wins (Object.assign order). Keep namespaces disjoint.
 *
 * Public API:
 *   useT() → { t, lang, setLang, dir }
 *     t(key, params?) — dot-path lookup with {var} interpolation
 *     lang           — 'he' | 'en'
 *     setLang(l)     — switch + persist + update <html lang/dir>
 *     dir            — 'rtl' | 'ltr' (derived from lang)
 *
 *   <LanguageProvider>{children}</LanguageProvider>
 *   getInitialLang() — localStorage → navigator.language → 'en'
 *   getDir(lang)     — 'rtl' for 'he', else 'ltr'
 */

const heFiles = import.meta.glob('./he/*.json', { eager: true });
const enFiles = import.meta.glob('./en/*.json', { eager: true });

const messages = {
  he: Object.assign({}, ...Object.values(heFiles).map((m) => m.default)),
  en: Object.assign({}, ...Object.values(enFiles).map((m) => m.default)),
};

const STORAGE_KEY = 'bayit_lang';
const SUPPORTED = ['he', 'en'];
const DEFAULT_LANG = 'en';

export function getDir(lang) {
  return lang === 'he' ? 'rtl' : 'ltr';
}

export function getInitialLang() {
  if (typeof window === 'undefined') return 'he';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    // localStorage may be unavailable (private mode, etc.) — fall through
  }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || '';
  if (nav.toLowerCase().startsWith('he')) return 'he';
  return DEFAULT_LANG;
}

function lookup(obj, key) {
  if (!obj || !key) return undefined;
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_m, name) =>
    params[name] !== undefined && params[name] !== null ? String(params[name]) : `{${name}}`,
  );
}

export function translate(lang, key, params) {
  const value = lookup(messages[lang], key);
  if (typeof value !== 'string') return key;
  return interpolate(value, params);
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => getInitialLang());

  // Sync <html lang/dir> on mount and whenever lang changes.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = getDir(lang);
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — non-fatal
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
      document.documentElement.dir = getDir(next);
    }
  }, []);

  const value = useMemo(() => {
    const t = (key, params) => translate(lang, key, params);
    return { t, lang, setLang, dir: getDir(lang) };
  }, [lang, setLang]);

  return createElement(LanguageContext.Provider, { value }, children);
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback so a component can still render outside the provider (tests, etc.)
    const lang = DEFAULT_LANG;
    return {
      t: (key, params) => translate(lang, key, params),
      lang,
      setLang: () => {},
      dir: getDir(lang),
    };
  }
  return ctx;
}
