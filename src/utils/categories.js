/**
 * Two-level category taxonomy for user interests and projects.
 * Categories are stored as flat string keys: 'parent:child' (e.g. 'tech:saas').
 * Free-text categories live under 'other:' (e.g. 'other:אקדמיה').
 */

export const TAXONOMY = [
  {
    key: 'tech',
    label: 'טכנולוגיה ותוכנה',
    subs: [
      { key: 'saas', label: 'SaaS' },
      { key: 'ai', label: 'AI / ML' },
      { key: 'cyber', label: 'סייבר' },
      { key: 'enterprise', label: 'תוכנה ארגונית' },
      { key: 'mobile', label: 'אפליקציות מובייל' },
      { key: 'web3', label: "Web3 / בלוקצ'יין" },
      { key: 'iot', label: 'IoT / חומרה' },
      { key: 'devops', label: 'DevOps / תשתיות' },
    ],
  },
  {
    key: 'marketing',
    label: 'שיווק, מדיה ותוכן',
    subs: [
      { key: 'digital', label: 'שיווק דיגיטלי' },
      { key: 'performance', label: 'ביצועים (Performance)' },
      { key: 'brand', label: 'מותג ותוכן' },
      { key: 'social', label: 'רשתות חברתיות' },
      { key: 'pr', label: 'יחסי ציבור' },
      { key: 'design', label: 'עיצוב ו-UX' },
      { key: 'video', label: 'וידאו והפקות' },
    ],
  },
  {
    key: 'finance',
    label: 'פיננסים והשקעות',
    subs: [
      { key: 'fintech', label: 'FinTech' },
      { key: 'investments', label: 'השקעות / שוק הון' },
      { key: 'vc', label: 'גיוס הון / VC' },
      { key: 'advisory', label: 'ייעוץ פיננסי' },
      { key: 'insurance', label: 'ביטוח' },
      { key: 'regulation', label: 'רגולציה ומשפט פיננסי' },
    ],
  },
  {
    key: 'realestate',
    label: 'נדל"ן ובנייה',
    subs: [
      { key: 'income', label: 'נדל"ן מניב' },
      { key: 'development', label: 'נדל"ן יזמי' },
      { key: 'proptech', label: 'PropTech' },
      { key: 'construction', label: 'בנייה והנדסה' },
      { key: 'architecture', label: 'עיצוב פנים / אדריכלות' },
      { key: 'foreign', label: 'נדל"ן בחו"ל' },
    ],
  },
  {
    key: 'climate',
    label: 'סביבה, אקלים ואימפקט',
    subs: [
      { key: 'climatetech', label: 'ClimateTech' },
      { key: 'energy', label: 'אנרגיה מתחדשת' },
      { key: 'recycling', label: 'מיחזור וניהול פסולת' },
      { key: 'agritech', label: 'חקלאות בת קיימא' },
      { key: 'impact', label: 'אימפקט חברתי' },
      { key: 'health', label: 'בריאות וקיימות' },
    ],
  },
  {
    key: 'business',
    label: 'יזמות, ייעוץ וניהול',
    subs: [
      { key: 'general', label: 'יזמות כללית' },
      { key: 'consulting', label: 'ייעוץ עסקי' },
      { key: 'pm', label: 'ניהול פרויקטים' },
      { key: 'sales', label: 'מכירות ו-BD' },
      { key: 'hr', label: 'משאבי אנוש' },
      { key: 'legal', label: 'משפטים' },
      { key: 'edtech', label: 'חינוך והדרכה (EdTech)' },
      { key: 'healthtech', label: 'בריאות (HealthTech)' },
      { key: 'retail', label: 'ריטייל ומסחר' },
    ],
  },
  {
    key: 'other',
    label: 'אחר',
    subs: [],
    allowCustom: true,
  },
];

/** Map old free-text/legacy categories → new 'parent:child' keys. */
export const LEGACY_MAP = {
  'SaaS / תוכנה': 'tech:saas',
  'SaaS / מוצר': 'tech:saas',
  'AI / ML': 'tech:ai',
  'AI / אוטומציה': 'tech:ai',
  'AI / אוטומציה / SAAS': 'tech:ai',
  'טכנולוגיה ו AI': 'tech:ai',
  טכנולוגיה: 'tech:saas',
  Cybersecurity: 'tech:cyber',
  FinTech: 'finance:fintech',
  'פינטק / שוק הון': 'finance:fintech',
  EdTech: 'business:edtech',
  HealthTech: 'business:healthtech',
  MedTech: 'business:healthtech',
  HRTech: 'business:hr',
  ClimateTech: 'climate:climatetech',
  'ייעוץ עסקי': 'business:consulting',
  'יזמות / ייעוץ': 'business:consulting',
  משפטים: 'business:legal',
  'ניהול פרויקטים': 'business:pm',
  'השקעות / פיננסים': 'finance:investments',
  'מכירות ו-BD': 'business:sales',
  'שיווק דיגיטלי': 'marketing:digital',
  'שיווק / מדיה': 'marketing:digital',
  'שיווק ומדיה': 'marketing:digital',
  'מדיה ותוכן': 'marketing:brand',
  'נדל"ן': 'realestate:development',
  'בנייה והנדסה': 'realestate:construction',
  'בנייה / הנדסה': 'realestate:construction',
  'עיצוב ו-UX': 'marketing:design',
  'עיצוב / יצירה': 'marketing:design',
  'יזמות כללית': 'business:general',
  'מסעדנות ואופליין': 'business:retail',
  אימפקט: 'climate:impact',
  'מיחזור ניהול פסולת': 'climate:recycling',
  // Legacy free-text "domain" tokens from older imports
  Marketing: 'marketing:digital',
  marketing: 'marketing:digital',
  'מנהל פרויקטים': 'business:pm',
  'ניהול פרוייקטים': 'business:pm',
  'מנתח מערכות מידע': 'tech:enterprise',
  'הנדסה אזרחית': 'realestate:construction',
  בינוי: 'realestate:construction',
};

/**
 * Resolve a member's category set, handling all legacy shapes:
 *   1. categories: string[] of new keys ('parent:child') or legacy strings
 *   2. legacy `domain` field: comma-separated free-text tokens
 * Returns deduped string[] of raw category tokens (NOT yet migrated —
 * downstream consumers like groupByParent / parentOf migrate as needed).
 */
export function resolveMemberCategories(member) {
  if (!member) return [];
  if (Array.isArray(member.categories) && member.categories.length) {
    return member.categories;
  }
  if (typeof member.domain === 'string' && member.domain.trim()) {
    const tokens = member.domain
      .split(/[,،;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    return [...new Set(tokens)];
  }
  return [];
}

const PARENT_INDEX = new Map(TAXONOMY.map((p) => [p.key, p]));
const SUB_INDEX = new Map();
for (const parent of TAXONOMY) {
  for (const sub of parent.subs) {
    SUB_INDEX.set(`${parent.key}:${sub.key}`, { parent, sub });
  }
}

/** Parse 'parent:child' → { parentKey, childKey, isCustom }. */
export function parseCategoryKey(key) {
  if (!key || typeof key !== 'string') return null;
  const idx = key.indexOf(':');
  if (idx === -1) return { parentKey: 'other', childKey: key, isCustom: true };
  const parentKey = key.slice(0, idx);
  const childKey = key.slice(idx + 1);
  const parent = PARENT_INDEX.get(parentKey);
  const isCustom = !parent || parentKey === 'other' || !parent.subs.some((s) => s.key === childKey);
  return { parentKey, childKey, isCustom };
}

/** Get the parent key of a category. */
export function parentOf(key) {
  const parsed = parseCategoryKey(key);
  return parsed?.parentKey || 'other';
}

/** Hebrew label for a parent key. */
export function parentLabel(parentKey) {
  return PARENT_INDEX.get(parentKey)?.label || 'אחר';
}

/**
 * Hebrew label for a single category.
 * Backward compatibility: if `key` is a legacy plain string (no colon, not in
 * taxonomy), returns it as-is.
 */
export function categoryLabel(key) {
  if (!key) return '';
  const sub = SUB_INDEX.get(key);
  if (sub) return sub.sub.label;
  const parsed = parseCategoryKey(key);
  if (parsed?.isCustom) return parsed.childKey;
  return key;
}

/** "טכנולוגיה › SaaS" — for tooltips or detail view. */
export function categoryFullLabel(key) {
  const parsed = parseCategoryKey(key);
  if (!parsed) return '';
  const parent = parentLabel(parsed.parentKey);
  const child = categoryLabel(key);
  if (!child || child === parent) return parent;
  return `${parent} › ${child}`;
}

/**
 * Group an array of category keys by parent.
 * Auto-migrates legacy plain strings via LEGACY_MAP so display works
 * uniformly across migrated and non-migrated data (e.g. formRegistrants).
 * Returns an array of { parentKey, parentLabel, items: [{key, label}] }
 * preserving taxonomy order, deduped by final key.
 */
export function groupByParent(keys) {
  if (!Array.isArray(keys)) return [];
  const buckets = new Map();
  const seenKeys = new Set();
  for (const raw of keys) {
    if (!raw) continue;
    // Migrate legacy strings; valid 'parent:child' keys pass through unchanged.
    const key = SUB_INDEX.has(raw) ? raw : migrateLegacyCategory(raw) || raw;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    const parsed = parseCategoryKey(key);
    if (!parsed) continue;
    const { parentKey } = parsed;
    if (!buckets.has(parentKey)) buckets.set(parentKey, []);
    buckets.get(parentKey).push({ key, label: categoryLabel(key) });
  }
  const order = TAXONOMY.map((p) => p.key);
  return order
    .filter((pk) => buckets.has(pk))
    .map((pk) => ({
      parentKey: pk,
      parentLabel: parentLabel(pk),
      items: buckets.get(pk),
    }));
}

/**
 * Migrate a single legacy category string → new key.
 * Returns null if no mapping found and it's not already a valid new key.
 */
export function migrateLegacyCategory(old) {
  if (!old || typeof old !== 'string') return null;
  if (SUB_INDEX.has(old)) return old;
  if (old.startsWith('other:')) return old;
  if (LEGACY_MAP[old]) return LEGACY_MAP[old];
  return `other:${old}`;
}

/** Migrate a list of legacy categories, deduped, preserving order. */
export function migrateLegacyCategories(oldList) {
  if (!Array.isArray(oldList)) return [];
  const seen = new Set();
  const out = [];
  for (const old of oldList) {
    const next = migrateLegacyCategory(old);
    if (next && !seen.has(next)) {
      seen.add(next);
      out.push(next);
    }
  }
  return out;
}

export const MAX_CATEGORIES = 6;
