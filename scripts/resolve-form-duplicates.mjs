#!/usr/bin/env node
/**
 * Resolve "form duplicates" — formRegistrants entries that match existing users.
 *
 * Detects cross-collection matches (formRegistrants ↔ users) by phone/name,
 * enriches the user profile with non-empty form data (never overwrites),
 * and marks the formRegistrant as claimed so it disappears from FormClaim lists.
 *
 * Also supports --fuzzy-users for intra-users duplicate detection.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/root/.config/firebase-keys/bayit-community-sa.json \
 *     node scripts/resolve-form-duplicates.mjs                # dry-run (default)
 *     node scripts/resolve-form-duplicates.mjs --execute      # apply changes (interactive)
 *     node scripts/resolve-form-duplicates.mjs --execute --yes  # non-interactive
 *     node scripts/resolve-form-duplicates.mjs --fuzzy-users  # also check intra-users
 *     node scripts/resolve-form-duplicates.mjs --person "איילת"  # limit to a name substring
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const argVal = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : null;
};

const EXECUTE = hasFlag('--execute');
const YES = hasFlag('--yes');
const FUZZY = hasFlag('--fuzzy-users');
const PERSON = argVal('--person');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

// ------------------------------ helpers ------------------------------
const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
const normPhone = (s) => {
  const digits = (s || '').toString().replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return '0' + digits.slice(3);
  if (digits.startsWith('0')) return digits;
  return digits;
};
const isFilled = (v) => Array.isArray(v) ? v.length > 0 : (v != null && v !== '');

// Negative/empty values the form commonly has — treat as "not provided"
const NEGATIVE_RE = /^\s*(לא|כרגע לא|אין|אין\.|לא\.|-|—|N\/A|n\/a)\s*\.?\s*$/i;
const isMeaningful = (v) => isFilled(v) && !NEGATIVE_RE.test(String(v).trim());

// needs < 5 chars is treated as noise/typo ("שו"), and form may overwrite it
const NEEDS_MIN_LEN = 5;

function parseContact(contact, contactType) {
  const result = { phone: '', li: '', website: '', email: '' };
  if (!contact) return result;
  const c = contact.trim();
  const type = (contactType || '').trim();
  const liMatch = c.match(/(https?:\/\/[^\s,;]*linkedin[^\s,;]*)/i);
  if (liMatch) result.li = liMatch[1];
  if (type.includes('אימייל') || type.includes('email')) {
    result.email = c;
  } else if (type.includes('WhatsApp') || type.includes('וואטסאפ')) {
    const wa = c.match(/wa\.me\/\+?(\d+)/);
    if (wa) result.phone = '+' + wa[1];
    else {
      const nums = c.replace(/[^\d]/g, '');
      if (nums.length >= 7) result.phone = '+' + nums;
    }
  } else if (type.includes('טלפון') || type.includes('phone')) {
    const nums = c.replace(/[^\d+]/g, '').replace(/^\+?/, '+');
    if (nums.length >= 7) result.phone = nums;
  } else if (type.includes('אתר') || type.includes('website')) {
    const url = c.match(/(https?:\/\/[^\s,;]+)/i);
    if (url) result.website = url[1];
    else if (c.includes('.')) result.website = 'https://' + c.split(/[\s,;]/)[0];
  }
  if (!result.phone) {
    const pm = c.match(/(?:^|[\s,;])(\+?\d[\d\s-]{6,14}\d)(?:$|[\s,;])/);
    if (pm) {
      const nums = pm[1].replace(/[\s-]/g, '');
      result.phone = nums.startsWith('+') ? nums : '+' + nums;
    }
  }
  return result;
}

// Levenshtein for fuzzy user-to-user matching
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
const similarity = (a, b) => {
  const max = Math.max(a.length, b.length) || 1;
  return 1 - lev(a, b) / max;
};

function computeEnrichment(user, form) {
  const updates = {};
  const contact = parseContact(form.contact, form.contactType);
  if (!isFilled(user.strength) && isMeaningful(form.strength)) updates.strength = form.strength;
  if (!isFilled(user.canHelpWith) && isMeaningful(form.canHelpWith)) updates.canHelpWith = form.canHelpWith;
  if (!isFilled(user.does) && isMeaningful(form.whatTheyDo)) updates.does = form.whatTheyDo;
  const userNeedsIsShort = !isFilled(user.needs) || String(user.needs).trim().length < NEEDS_MIN_LEN;
  if (userNeedsIsShort) {
    const parts = [form.seeking, form.specificNeed].filter(isMeaningful);
    if (parts.length) updates.needs = parts.join('\n');
  }
  if (!isFilled(user.city) && isMeaningful(form.location)) updates.city = form.location;
  if (!isFilled(user.li) && isFilled(contact.li)) {
    updates.li = contact.li.startsWith('http') ? contact.li : 'https://' + contact.li;
  }
  if (!isFilled(user.website) && isFilled(contact.website)) {
    updates.website = contact.website.startsWith('http') ? contact.website : 'https://' + contact.website;
  }
  return updates;
}

function prompt(q) {
  if (YES) return Promise.resolve('y');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((r) => rl.question(q, (a) => { rl.close(); r(a.trim().toLowerCase()); }));
}

// ------------------------------ main ------------------------------
const auditLog = {
  startedAt: new Date().toISOString(),
  mode: EXECUTE ? 'execute' : 'dry-run',
  fuzzy: FUZZY,
  filter: PERSON || null,
  crossCollection: [],
  fuzzyUsers: [],
};

console.log(`\n[${auditLog.mode.toUpperCase()}] resolve-form-duplicates starting\n`);

// Load all data
const usersSnap = await db.collection('users').get();
const frSnap = await db.collection('formRegistrants').get();
const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
const forms = frSnap.docs.map(d => ({ id: d.id, ...d.data() }));

console.log(`Loaded ${users.length} users, ${forms.length} formRegistrants\n`);

// Build user lookup indexes
const byPhone = new Map();
const byName = new Map();
for (const u of users) {
  const p = normPhone(u.phone);
  const n = norm(`${u.first || ''} ${u.last || ''}`);
  if (p) byPhone.set(p, u);
  if (n && n.length > 3) byName.set(n, u);
}

// ========== Phase 1: cross-collection (form ↔ user) ==========
console.log('=== Phase 1: formRegistrants matching an existing user ===\n');

const pairs = [];
for (const f of forms) {
  if (f.claimed) continue;
  if (PERSON && !(norm(f.fullName || '')).includes(norm(PERSON))) continue;
  const contact = parseContact(f.contact, f.contactType);
  const phone = normPhone(contact.phone);
  const nameKey = norm(f.fullName || '');
  const hits = new Set();
  if (phone && byPhone.has(phone)) hits.add(byPhone.get(phone));
  if (nameKey && byName.has(nameKey)) hits.add(byName.get(nameKey));
  if (hits.size === 0) continue;
  if (hits.size > 1) {
    console.log(`⚠️  form ${f.id} (${f.fullName}) matches multiple users — skipping, resolve manually`);
    continue;
  }
  const user = [...hits][0];
  pairs.push({ form: f, user });
}

console.log(`Found ${pairs.length} cross-collection matches to resolve\n`);

let applied = 0, skipped = 0;
for (const { form, user } of pairs) {
  const enrichment = computeEnrichment(user, form);
  const enrichedFields = Object.keys(enrichment);

  console.log('─'.repeat(70));
  console.log(`form ${form.id}  →  user ${user.uid}`);
  console.log(`  name:   ${form.fullName}  ↔  ${user.first || ''} ${user.last || ''}`);
  console.log(`  match:  phone=${normPhone(parseContact(form.contact, form.contactType).phone) || '-'}  nameMatch=${norm(form.fullName || '') === norm(`${user.first || ''} ${user.last || ''}`)}`);
  if (enrichedFields.length === 0) {
    console.log(`  enrich: (nothing to copy — user already has all fields)`);
  } else {
    console.log(`  enrich:`);
    for (const k of enrichedFields) {
      const val = enrichment[k];
      const short = typeof val === 'string' ? (val.length > 90 ? val.slice(0, 87) + '…' : val) : JSON.stringify(val);
      console.log(`    + ${k}: ${short}`);
    }
  }
  console.log(`  claim:  formRegistrants/${form.id} → claimed=true, claimedBy=${user.uid}`);

  const entry = {
    formId: form.id,
    userUid: user.uid,
    fullName: form.fullName,
    enrichment,
  };

  if (!EXECUTE) {
    auditLog.crossCollection.push({ ...entry, action: 'would-apply' });
    continue;
  }

  const ans = await prompt('  Apply? [y/n/q]: ');
  if (ans === 'q') { console.log('  quit'); break; }
  if (ans !== 'y' && ans !== '') { skipped++; auditLog.crossCollection.push({ ...entry, action: 'skipped' }); continue; }

  const batch = db.batch();
  if (enrichedFields.length) batch.update(db.collection('users').doc(user.uid), enrichment);
  batch.update(db.collection('formRegistrants').doc(form.id), {
    claimed: true,
    claimedBy: user.uid,
    claimedAt: new Date().toISOString(),
    claimedVia: 'dedup-script',
  });
  await batch.commit();
  applied++;
  auditLog.crossCollection.push({ ...entry, action: 'applied' });
  console.log(`  ✓ applied`);
}

console.log(`\nPhase 1 result: ${EXECUTE ? `applied=${applied}, skipped=${skipped}` : `would-apply=${pairs.length}`}\n`);

// ========== Phase 2: fuzzy user-to-user (optional) ==========
if (FUZZY) {
  console.log('=== Phase 2: fuzzy user-to-user duplicate search ===\n');
  const candidates = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const a = users[i], b = users[j];
      const na = norm(`${a.first || ''} ${a.last || ''}`);
      const nb = norm(`${b.first || ''} ${b.last || ''}`);
      const pa = normPhone(a.phone), pb = normPhone(b.phone);
      const ea = norm(a.email), eb = norm(b.email);
      const reasons = [];
      if (na && nb && similarity(na, nb) >= 0.85) reasons.push(`name≈ (${similarity(na, nb).toFixed(2)})`);
      if (pa && pb && pa === pb) reasons.push('phone=');
      if (ea && eb && ea === eb) reasons.push('email=');
      if (reasons.length) candidates.push({ a, b, reasons });
    }
  }
  if (!candidates.length) console.log('  no fuzzy user duplicates found\n');
  for (const c of candidates) {
    console.log(`⚠️  ${c.a.uid}  ↔  ${c.b.uid}`);
    console.log(`    a: ${c.a.first || ''} ${c.a.last || ''} | ${c.a.phone} | ${c.a.email}`);
    console.log(`    b: ${c.b.first || ''} ${c.b.last || ''} | ${c.b.phone} | ${c.b.email}`);
    console.log(`    reasons: ${c.reasons.join(', ')}\n`);
    auditLog.fuzzyUsers.push({ aUid: c.a.uid, bUid: c.b.uid, reasons: c.reasons });
  }
  console.log(`Phase 2 found ${candidates.length} candidate user pairs (manual review only — not auto-resolved)\n`);
}

// ------------------------------ write audit log ------------------------------
auditLog.finishedAt = new Date().toISOString();
const logsDir = join(__dirname, 'logs');
mkdirSync(logsDir, { recursive: true });
const logPath = join(logsDir, `dedup-${Date.now()}.json`);
writeFileSync(logPath, JSON.stringify(auditLog, null, 2), 'utf8');
console.log(`Audit log: ${logPath}`);

process.exit(0);
