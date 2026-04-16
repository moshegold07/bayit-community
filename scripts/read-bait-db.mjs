import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const sa = JSON.parse(readFileSync(new URL('./bait-sa.json', import.meta.url), 'utf8'));

const app = initializeApp({ credential: cert(sa) }, 'bait-source');
const db = getFirestore(app);
const auth = getAuth(app);

// 1. List all top-level collections
console.log('=== Collections ===');
const collections = await db.listCollections();
for (const col of collections) {
  const snap = await col.get();
  console.log(`  ${col.id}: ${snap.size} docs`);
}

// 2. Read all users
console.log('\n=== Users ===');
const usersSnap = await db.collection('users').get();
if (usersSnap.empty) {
  console.log('  (no users found)');
} else {
  usersSnap.forEach(doc => {
    console.log(`\n  [${doc.id}]`);
    const d = doc.data();
    for (const [k, v] of Object.entries(d)) {
      console.log(`    ${k}: ${JSON.stringify(v)}`);
    }
  });
}

// 3. Read phoneIndex
console.log('\n=== PhoneIndex ===');
const phoneSnap = await db.collection('phoneIndex').get();
if (phoneSnap.empty) {
  console.log('  (no phoneIndex found)');
} else {
  phoneSnap.forEach(doc => {
    console.log(`  ${doc.id} => ${JSON.stringify(doc.data())}`);
  });
}

// 4. List Firebase Auth users
console.log('\n=== Auth Users ===');
const authList = await auth.listUsers(100);
for (const u of authList.users) {
  console.log(`  ${u.uid} | ${u.email || '(no email)'} | created: ${u.metadata.creationTime}`);
}

console.log('\n=== Done ===');
process.exit(0);
