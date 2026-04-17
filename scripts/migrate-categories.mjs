#!/usr/bin/env node
/**
 * Migrate legacy user.categories strings → new 'parent:child' keys.
 *
 * Usage:
 *   node scripts/migrate-categories.mjs            # dry-run (default)
 *   node scripts/migrate-categories.mjs --apply    # write to Firestore
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or the service-account key at
 * /root/.config/firebase-keys/bayit-community-sa.json.
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { migrateLegacyCategories } from '../src/utils/categories.js';

const APPLY = process.argv.includes('--apply');
const SA_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  '/root/.config/firebase-keys/bayit-community-sa.json';

if (!admin.apps.length) {
  const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

console.log(`\n=== Migrate user categories — ${APPLY ? 'APPLY' : 'DRY-RUN'} ===\n`);

const snap = await db.collection('users').get();
let changed = 0;
let unchanged = 0;
const writes = [];

snap.forEach((doc) => {
  const data = doc.data();
  const old = Array.isArray(data.categories) ? data.categories : [];
  if (old.length === 0) {
    unchanged++;
    return;
  }
  const next = migrateLegacyCategories(old);
  const isSame = old.length === next.length && old.every((v, i) => v === next[i]);
  if (isSame) {
    unchanged++;
    return;
  }
  changed++;
  const name = `${data.first || ''} ${data.last || ''}`.trim() || doc.id;
  console.log(`• ${name}`);
  console.log(`    old: [${old.join(', ')}]`);
  console.log(`    new: [${next.join(', ')}]`);
  writes.push({ id: doc.id, next });
});

console.log(`\nTotal: ${snap.size} | changed: ${changed} | unchanged: ${unchanged}`);

if (!APPLY) {
  console.log('\nDry-run only. Re-run with --apply to write changes.\n');
  process.exit(0);
}

console.log('\nWriting...');
for (const w of writes) {
  await db.collection('users').doc(w.id).update({
    categories: w.next,
    domain: w.next.join(', '),
  });
}
console.log(`Updated ${writes.length} users.\n`);
process.exit(0);
