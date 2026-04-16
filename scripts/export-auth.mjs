import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, writeFileSync } from 'fs';

const sa = JSON.parse(readFileSync(new URL('./bait-sa.json', import.meta.url), 'utf8'));
const app = initializeApp({ credential: cert(sa) }, 'bait-export');
const auth = getAuth(app);

// List users and check for password hash availability
const result = await auth.listUsers(100);
const exportData = [];

for (const user of result.users) {
  const rec = {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    disabled: user.disabled,
    creationTime: user.metadata.creationTime,
    lastSignInTime: user.metadata.lastSignInTime,
    hasPasswordHash: !!user.passwordHash,
    hasPasswordSalt: !!user.passwordSalt,
  };

  if (user.passwordHash) {
    rec.passwordHash = user.passwordHash;
    rec.passwordSalt = user.passwordSalt;
  }

  exportData.push(rec);
  console.log(`${user.email} — hash: ${rec.hasPasswordHash ? 'YES' : 'NO'}`);
}

writeFileSync(
  new URL('./auth-export.json', import.meta.url),
  JSON.stringify(exportData, null, 2)
);

console.log(`\nExported ${exportData.length} users to auth-export.json`);
process.exit(0);
