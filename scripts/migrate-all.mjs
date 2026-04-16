/**
 * Full migration: bait-de724 → bayit-community
 * 1. Import Auth users with password hashes
 * 2. Copy Firestore: users, phoneIndex, settings
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// --- Init both projects ---
const srcSA = JSON.parse(readFileSync(new URL('./bait-sa.json', import.meta.url), 'utf8'));
const dstSA = JSON.parse(readFileSync(new URL('./bayit-sa.json', import.meta.url), 'utf8'));

const srcApp = initializeApp({ credential: cert(srcSA) }, 'source');
const dstApp = initializeApp({ credential: cert(dstSA) }, 'destination');

const srcDb = getFirestore(srcApp);
const dstDb = getFirestore(dstApp);
const srcAuth = getAuth(srcApp);
const dstAuth = getAuth(dstApp);

// Hash config from bait-de724 (retrieved via Identity Toolkit API)
const HASH_CONFIG = {
  algorithm: 'SCRYPT',
  key: Buffer.from('oI1OCDADlbRdzgiUOrF7Cf2TLYpEI/UF9XXRe0ciCJw4v8N4lUTVaPKuYzZCXNy9NOpq690tJ6pxthUV1UR3mA==', 'base64'),
  saltSeparator: Buffer.from('Bw==', 'base64'),
  rounds: 8,
  memoryCost: 14,
};

let stats = { authImported: 0, authSkipped: 0, firestoreCopied: 0, errors: [] };

// ============================================================
// STEP 1: Import Auth users
// ============================================================
console.log('=== Step 1: Auth Users ===');
const srcUsers = await srcAuth.listUsers(1000);

// Check which users already exist in destination
const usersToImport = [];
for (const user of srcUsers.users) {
  try {
    await dstAuth.getUser(user.uid);
    console.log(`  SKIP (exists): ${user.email}`);
    stats.authSkipped++;
  } catch {
    usersToImport.push(user);
  }
}

if (usersToImport.length > 0) {
  const importRecords = usersToImport.map(user => ({
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    disabled: user.disabled,
    metadata: {
      creationTime: user.metadata.creationTime,
      lastSignInTime: user.metadata.lastSignInTime,
    },
    passwordHash: user.passwordHash,
    passwordSalt: user.passwordSalt,
  }));

  const result = await dstAuth.importUsers(importRecords, {
    hash: HASH_CONFIG,
  });

  stats.authImported = importRecords.length - (result.failureCount || 0);
  if (result.errors?.length) {
    for (const err of result.errors) {
      const msg = `Auth import error [${importRecords[err.index]?.email}]: ${err.error.message}`;
      console.log(`  ERROR: ${msg}`);
      stats.errors.push(msg);
    }
  }
  console.log(`  Imported: ${stats.authImported} | Failed: ${result.failureCount || 0}`);
} else {
  console.log('  All users already exist — nothing to import');
}

// ============================================================
// STEP 2: Copy Firestore collections
// ============================================================
async function copyCollection(name) {
  console.log(`\n=== Step 2: Firestore "${name}" ===`);
  const snap = await srcDb.collection(name).get();
  if (snap.empty) {
    console.log('  (empty collection)');
    return;
  }

  for (const doc of snap.docs) {
    try {
      // Check if already exists
      const existing = await dstDb.collection(name).doc(doc.id).get();
      if (existing.exists) {
        console.log(`  SKIP (exists): ${name}/${doc.id}`);
        continue;
      }
      await dstDb.collection(name).doc(doc.id).set(doc.data());
      console.log(`  COPIED: ${name}/${doc.id}`);
      stats.firestoreCopied++;
    } catch (e) {
      const msg = `Firestore error ${name}/${doc.id}: ${e.message}`;
      console.log(`  ERROR: ${msg}`);
      stats.errors.push(msg);
    }
  }
}

await copyCollection('users');
await copyCollection('phoneIndex');
await copyCollection('settings');

// ============================================================
// Summary
// ============================================================
console.log('\n========== MIGRATION COMPLETE ==========');
console.log(`Auth imported:     ${stats.authImported}`);
console.log(`Auth skipped:      ${stats.authSkipped}`);
console.log(`Firestore copied:  ${stats.firestoreCopied}`);
console.log(`Errors:            ${stats.errors.length}`);
if (stats.errors.length) {
  console.log('\nErrors:');
  stats.errors.forEach(e => console.log(`  - ${e}`));
}

process.exit(0);
