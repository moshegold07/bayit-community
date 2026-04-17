// Read-only research: find Ayelet Nechmadi + check cross-collection dupes.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
const normPhone = (s) => (s || '').toString().replace(/\D/g, '').replace(/^972/, '0');

console.log('=== Search users for "איילת" / "נחמדי" / "ayelet" ===');
const usersSnap = await db.collection('users').get();
for (const d of usersSnap.docs) {
  const u = d.data();
  const hay = `${u.first||''} ${u.last||''} ${u.email||''}`.toLowerCase();
  if (hay.includes('איילת') || hay.includes('נחמדי') || hay.includes('ayelet') || hay.includes('nechmadi') || hay.includes('nehmadi')) {
    console.log(`\n[USER] ${d.id}`);
    for (const [k,v] of Object.entries(u)) console.log(`  ${k}: ${JSON.stringify(v)}`);
  }
}

console.log('\n=== Search formRegistrants for "איילת" / "נחמדי" ===');
const frSnap = await db.collection('formRegistrants').get();
for (const d of frSnap.docs) {
  const f = d.data();
  const hay = `${f.fullName||''} ${f.email||''} ${f.contact||''}`.toLowerCase();
  if (hay.includes('איילת') || hay.includes('נחמדי') || hay.includes('ayelet') || hay.includes('nechmadi') || hay.includes('nehmadi')) {
    console.log(`\n[FORM] ${d.id}`);
    for (const [k,v] of Object.entries(f)) console.log(`  ${k}: ${JSON.stringify(v)}`);
  }
}

console.log('\n=== Cross-collection dup check: formRegistrants vs users ===');
// Build user index by phone + email + name
const users = usersSnap.docs.map(x => ({ uid: x.id, ...x.data() }));
const byPhone = {}, byEmail = {}, byName = {};
for (const u of users) {
  const p = normPhone(u.phone);
  const e = norm(u.email);
  const n = norm(`${u.first||''} ${u.last||''}`);
  if (p) byPhone[p] = u;
  if (e) byEmail[e] = u;
  if (n && n.length > 3) byName[n] = u;
}

let crossDupes = 0;
for (const d of frSnap.docs) {
  const f = d.data();
  if (f.claimed) continue; // already linked, not a dupe
  // Try parse phone from contact
  let phone = '';
  if (f.contactType === 'phone' && f.contact) phone = normPhone(f.contact);
  const nameKey = norm(f.fullName || '');

  const matches = [];
  if (phone && byPhone[phone]) matches.push({ via: 'phone', user: byPhone[phone] });
  if (nameKey && byName[nameKey]) matches.push({ via: 'name', user: byName[nameKey] });

  if (matches.length) {
    crossDupes++;
    console.log(`\n[DUP] formRegistrant ${d.id}  fullName=${f.fullName}  contact=${f.contact}`);
    for (const m of matches) {
      console.log(`  via ${m.via} → user ${m.user.uid}  ${m.user.first||''} ${m.user.last||''}  source=${m.user.source||'(none)'}  phone=${m.user.phone||'-'}  email=${m.user.email||'-'}`);
    }
  }
}
console.log(`\nTotal formRegistrants matching an existing user (not claimed): ${crossDupes}`);
process.exit(0);
