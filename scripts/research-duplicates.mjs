// Read-only research: analyze users for duplicates & orphan risk.
// Run: GOOGLE_APPLICATION_CREDENTIALS=/root/.config/firebase-keys/bayit-community-sa.json node scripts/research-duplicates.mjs
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const auth = getAuth();

const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
const normPhone = (s) => (s || '').toString().replace(/\D/g, '').replace(/^972/, '0');

function fieldFillRate(users) {
  const fields = ['first','last','phone','email','city','categories','domain','li','website','does','needs','strength','canHelpWith','status','role'];
  const counts = {};
  for (const f of fields) counts[f] = 0;
  for (const u of users) {
    for (const f of fields) {
      const v = u[f];
      if (Array.isArray(v) ? v.length : (v != null && v !== '')) counts[f]++;
    }
  }
  return counts;
}

async function countUserContent(uid) {
  const result = {};
  const checks = [
    ['projects', 'ownerId'],
    ['projects', 'createdBy'],
    ['forums', 'authorId'],
    ['forums', 'createdBy'],
    ['events', 'createdBy'],
    ['polls', 'createdBy'],
    ['resources', 'sharedBy'],
    ['conversations', 'participants'], // array-contains
  ];
  for (const [col, field] of checks) {
    try {
      let q;
      if (field === 'participants') {
        q = db.collection(col).where(field, 'array-contains', uid);
      } else {
        q = db.collection(col).where(field, '==', uid);
      }
      const snap = await q.limit(5).get();
      if (!snap.empty) result[`${col}.${field}`] = snap.size;
    } catch (_) { /* collection may not exist */ }
  }
  return result;
}

console.log('=== Collections overview ===');
const cols = await db.listCollections();
for (const c of cols) {
  const s = await c.count().get();
  console.log(`  ${c.id}: ${s.data().count}`);
}

console.log('\n=== Users pull ===');
const snap = await db.collection('users').get();
const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
console.log(`  total users: ${users.length}`);

const bySource = {};
for (const u of users) {
  const s = u.source || '(none)';
  bySource[s] = (bySource[s] || 0) + 1;
}
console.log('  by source:', bySource);

console.log('\n=== Field fill rates ===');
const formUsers = users.filter(u => u.source === 'google-form');
const otherUsers = users.filter(u => u.source !== 'google-form');
console.log(`  form users (${formUsers.length}):`, fieldFillRate(formUsers));
console.log(`  other users (${otherUsers.length}):`, fieldFillRate(otherUsers));

console.log('\n=== Duplicate detection ===');
const byPhone = {}, byEmail = {}, byName = {};
for (const u of users) {
  const p = normPhone(u.phone);
  const e = norm(u.email);
  const n = norm(`${u.first || ''} ${u.last || ''}`);
  if (p) (byPhone[p] ||= []).push(u.uid);
  if (e) (byEmail[e] ||= []).push(u.uid);
  if (n && n.length > 3) (byName[n] ||= []).push(u.uid);
}

const pairs = new Set();
const addPair = (a, b, reason) => {
  const key = [a, b].sort().join('|');
  pairs.add(JSON.stringify({ key, reason }));
};
for (const [k, list] of Object.entries(byPhone)) if (list.length > 1) list.forEach((a,i)=>list.slice(i+1).forEach(b=>addPair(a,b,`phone=${k}`)));
for (const [k, list] of Object.entries(byEmail)) if (list.length > 1) list.forEach((a,i)=>list.slice(i+1).forEach(b=>addPair(a,b,`email=${k}`)));
for (const [k, list] of Object.entries(byName))  if (list.length > 1) list.forEach((a,i)=>list.slice(i+1).forEach(b=>addPair(a,b,`name=${k}`)));

const uniquePairs = [...pairs].map(s => JSON.parse(s));
const groupedByKey = {};
for (const p of uniquePairs) (groupedByKey[p.key] ||= []).push(p.reason);

console.log(`  candidate pairs: ${Object.keys(groupedByKey).length}`);

for (const [key, reasons] of Object.entries(groupedByKey)) {
  const [a, b] = key.split('|');
  const ua = users.find(u => u.uid === a);
  const ub = users.find(u => u.uid === b);
  if (!ua || !ub) continue;

  // Determine form-side vs website-side
  const formSide = ua.source === 'google-form' ? ua : (ub.source === 'google-form' ? ub : null);
  const webSide  = ua.source !== 'google-form' ? ua : (ub.source !== 'google-form' ? ub : null);

  console.log(`\n--- Pair ---`);
  console.log(`  reasons: ${reasons.join(', ')}`);
  for (const u of [ua, ub]) {
    const label = u.source === 'google-form' ? 'FORM' : 'WEB ';
    const content = await countUserContent(u.uid);
    let lastSignIn = '-';
    try { const rec = await auth.getUser(u.uid); lastSignIn = rec.metadata.lastSignInTime || '-'; } catch {}
    console.log(`  [${label}] ${u.uid}  ${u.first || ''} ${u.last || ''}  email=${u.email || '-'}  phone=${u.phone || '-'}  status=${u.status || '-'}  createdAt=${u.createdAt || '-'}  lastSignIn=${lastSignIn}`);
    console.log(`         content=${JSON.stringify(content)}`);
  }

  if (formSide && webSide) {
    // Compare which fields form has that web is missing (potential merge value)
    const mergeable = [];
    const fields = ['phone','email','city','categories','domain','li','website','does','needs','strength','canHelpWith'];
    for (const f of fields) {
      const fv = formSide[f]; const wv = webSide[f];
      const fFilled = Array.isArray(fv) ? fv.length : (fv != null && fv !== '');
      const wFilled = Array.isArray(wv) ? wv.length : (wv != null && wv !== '');
      if (fFilled && !wFilled) mergeable.push(f);
    }
    console.log(`  >> fields to copy FORM→WEB on merge: [${mergeable.join(', ')}]`);
  } else {
    console.log(`  !! no clear FORM/WEB split — both sides sourced: ${ua.source || 'none'} / ${ub.source || 'none'}`);
  }
}

console.log('\n=== formRegistrants summary ===');
const fr = await db.collection('formRegistrants').get();
let claimed = 0, unclaimed = 0;
fr.forEach(d => { d.data().claimed ? claimed++ : unclaimed++; });
console.log(`  total: ${fr.size}, claimed: ${claimed}, unclaimed: ${unclaimed}`);

console.log('\nDone.');
process.exit(0);
