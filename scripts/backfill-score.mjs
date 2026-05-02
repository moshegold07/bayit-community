#!/usr/bin/env node
/**
 * Backfill `score` and `referredCount` on every users/* document.
 *
 * Phase 2 of admin roadmap — personal score system.
 * Each user gets `score: 0` and `referredCount: 0` if missing.
 * Users that already have both fields are skipped.
 *
 * Usage:
 *   cd /root/bayit-community
 *   node scripts/backfill-score.mjs --dry-run    # preview only
 *   node scripts/backfill-score.mjs              # apply (writes batched)
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const SA_PATH = '/root/.config/firebase-keys/bayit-community-sa.json';
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

if (!getApps().length) {
  let credentials;
  try {
    credentials = JSON.parse(readFileSync(SA_PATH, 'utf8'));
  } catch (err) {
    console.error(`Failed to load service account at ${SA_PATH}:`, err.message);
    process.exit(1);
  }
  initializeApp({ credential: cert(credentials), projectId: 'bayit-community' });
}

const db = getFirestore();

console.log(`\n[${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}] backfill-score starting\n`);

const snap = await db.collection('users').get();
console.log(`Loaded ${snap.size} users from Firestore\n`);

let updated = 0;
let skipped = 0;
const updates = [];

for (const doc of snap.docs) {
  const data = doc.data() || {};
  const hasScore = Object.prototype.hasOwnProperty.call(data, 'score');
  const hasCount = Object.prototype.hasOwnProperty.call(data, 'referredCount');

  if (hasScore && hasCount) {
    skipped++;
    continue;
  }

  const patch = {};
  if (!hasScore) patch.score = 0;
  if (!hasCount) patch.referredCount = 0;

  updates.push({ id: doc.id, patch });
  updated++;
}

if (DRY_RUN) {
  console.log('--- Sample (first 10 changes) ---');
  for (const u of updates.slice(0, 10)) {
    const fields = Object.keys(u.patch).join(', ');
    console.log(`  ${u.id}  →  set { ${fields} }`);
  }
  if (updates.length > 10) {
    console.log(`  ...and ${updates.length - 10} more`);
  }
  console.log(`\nDry-run summary: ${updated} would be updated, ${skipped} skipped\n`);
  process.exit(0);
}

// Live mode — write in batches of 400 (Firestore batch limit is 500, leave headroom)
const BATCH_SIZE = 400;
let written = 0;
for (let i = 0; i < updates.length; i += BATCH_SIZE) {
  const slice = updates.slice(i, i + BATCH_SIZE);
  const batch = db.batch();
  for (const u of slice) {
    batch.set(db.collection('users').doc(u.id), u.patch, { merge: true });
  }
  await batch.commit();
  written += slice.length;
  console.log(`  committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${written}/${updates.length})`);
}

console.log(`\nResult: ${updated} updated, ${skipped} skipped\n`);
process.exit(0);
