/**
 * Fix: Import Auth users with proper Buffer conversion for password hashes
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const srcSA = JSON.parse(readFileSync(new URL('./bait-sa.json', import.meta.url), 'utf8'));
const dstSA = JSON.parse(readFileSync(new URL('./bayit-sa.json', import.meta.url), 'utf8'));

const srcApp = initializeApp({ credential: cert(srcSA) }, 'src');
const dstApp = initializeApp({ credential: cert(dstSA) }, 'dst');

const srcAuth = getAuth(srcApp);
const dstAuth = getAuth(dstApp);

const HASH_CONFIG = {
  algorithm: 'SCRYPT',
  key: Buffer.from('oI1OCDADlbRdzgiUOrF7Cf2TLYpEI/UF9XXRe0ciCJw4v8N4lUTVaPKuYzZCXNy9NOpq690tJ6pxthUV1UR3mA==', 'base64'),
  saltSeparator: Buffer.from('Bw==', 'base64'),
  rounds: 8,
  memoryCost: 14,
};

// Get source users
const srcUsers = await srcAuth.listUsers(1000);

// Debug: check passwordHash type
const sample = srcUsers.users[0];
console.log(`Sample passwordHash type: ${typeof sample.passwordHash}`);
console.log(`Sample passwordHash value (first 40 chars): ${String(sample.passwordHash).substring(0, 40)}`);
console.log(`Is Buffer: ${Buffer.isBuffer(sample.passwordHash)}`);

const importRecords = srcUsers.users.map(user => {
  const rec = {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    disabled: user.disabled,
  };

  // Convert passwordHash to Buffer if it's a base64 string
  if (user.passwordHash) {
    rec.passwordHash = Buffer.isBuffer(user.passwordHash)
      ? user.passwordHash
      : Buffer.from(String(user.passwordHash), 'base64');
  }
  if (user.passwordSalt) {
    rec.passwordSalt = Buffer.isBuffer(user.passwordSalt)
      ? user.passwordSalt
      : Buffer.from(String(user.passwordSalt), 'base64');
  }

  return rec;
});

console.log(`\nImporting ${importRecords.length} users...`);
const result = await dstAuth.importUsers(importRecords, { hash: HASH_CONFIG });

console.log(`Success: ${importRecords.length - (result.failureCount || 0)}`);
console.log(`Failed:  ${result.failureCount || 0}`);

if (result.errors?.length) {
  for (const err of result.errors) {
    console.log(`  ERROR [${importRecords[err.index]?.email}]: ${err.error.message}`);
  }
}

process.exit(0);
