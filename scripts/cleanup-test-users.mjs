/**
 * Delete test/demo users from bayit-community (Auth + Firestore)
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync(new URL('./bayit-sa.json', import.meta.url), 'utf8'));
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);
const auth = getAuth(app);

const TEST_EMAILS = [
  'admin@bayit.dev',
  'dana@bayit.dev',
  'yossi@bayit.dev',
  'noa@bayit.dev',
  'omer@bayit.dev',
  'rotem@bayit.dev',
];

// 1. Find and delete Auth + Firestore for each test email
for (const email of TEST_EMAILS) {
  try {
    const user = await auth.getUserByEmail(email);
    const uid = user.uid;

    // Delete Firestore user doc
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const phone = userDoc.data().phone;
      await db.collection('users').doc(uid).delete();
      console.log(`  Firestore users/${uid} DELETED`);

      // Delete phoneIndex if exists
      if (phone) {
        const phoneDoc = await db.collection('phoneIndex').doc(phone).get();
        if (phoneDoc.exists) {
          await db.collection('phoneIndex').doc(phone).delete();
          console.log(`  Firestore phoneIndex/${phone} DELETED`);
        }
      }
    } else {
      console.log(`  Firestore users/${uid} not found`);
    }

    // Delete Auth user
    await auth.deleteUser(uid);
    console.log(`  Auth ${email} (${uid}) DELETED`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      console.log(`  SKIP ${email} — not found in Auth`);
    } else {
      console.log(`  ERROR ${email}: ${e.message}`);
    }
  }
}

// 2. Show remaining state
console.log('\n=== Remaining Users ===');
const allUsers = await db.collection('users').get();
allUsers.forEach(doc => {
  const d = doc.data();
  console.log(`  ${d.email} — ${d.first} ${d.last} (${d.role}/${d.status})`);
});

console.log(`\nTotal: ${allUsers.size} users`);
process.exit(0);
