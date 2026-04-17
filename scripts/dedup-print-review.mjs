// Read-only: print full side-by-side review of every dedup pair.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const norm = (s)=>(s||'').toString().trim().toLowerCase().replace(/\s+/g,' ');
const normPhone = (s)=>{const d=(s||'').toString().replace(/\D/g,'');if(!d)return '';if(d.startsWith('972'))return '0'+d.slice(3);if(d.startsWith('0'))return d;return d;};
const isFilled=(v)=>Array.isArray(v)?v.length>0:(v!=null&&v!=='');
const NEGATIVE_RE=/^\s*(לא|כרגע לא|אין|אין\.|לא\.|-|—|N\/A|n\/a)\s*\.?\s*$/i;
const isMeaningful=(v)=>isFilled(v)&&!NEGATIVE_RE.test(String(v).trim());
const NEEDS_MIN_LEN=5;

function parseContact(contact, contactType){
  const r={phone:'',li:'',website:'',email:''};
  if(!contact)return r;
  const c=contact.trim();const t=(contactType||'').trim();
  const li=c.match(/(https?:\/\/[^\s,;]*linkedin[^\s,;]*)/i);if(li)r.li=li[1];
  if(t.includes('אימייל')||t.includes('email'))r.email=c;
  else if(t.includes('WhatsApp')||t.includes('וואטסאפ')){const wa=c.match(/wa\.me\/\+?(\d+)/);if(wa)r.phone='+'+wa[1];else{const n=c.replace(/[^\d]/g,'');if(n.length>=7)r.phone='+'+n;}}
  else if(t.includes('טלפון')||t.includes('phone')){const n=c.replace(/[^\d+]/g,'').replace(/^\+?/,'+');if(n.length>=7)r.phone=n;}
  else if(t.includes('אתר')||t.includes('website')){const u=c.match(/(https?:\/\/[^\s,;]+)/i);if(u)r.website=u[1];else if(c.includes('.'))r.website='https://'+c.split(/[\s,;]/)[0];}
  if(!r.phone){const pm=c.match(/(?:^|[\s,;])(\+?\d[\d\s-]{6,14}\d)(?:$|[\s,;])/);if(pm){const n=pm[1].replace(/[\s-]/g,'');r.phone=n.startsWith('+')?n:'+'+n;}}
  return r;
}

const [uSnap, fSnap] = await Promise.all([db.collection('users').get(), db.collection('formRegistrants').get()]);
const users = uSnap.docs.map(d=>({uid:d.id,...d.data()}));
const forms = fSnap.docs.map(d=>({id:d.id,...d.data()}));

const byPhone = new Map(), byName = new Map();
for (const u of users) {
  const p = normPhone(u.phone); const n = norm(`${u.first||''} ${u.last||''}`);
  if (p) byPhone.set(p, u);
  if (n && n.length > 3) byName.set(n, u);
}

const pairs = [];
for (const f of forms) {
  if (f.claimed) continue;
  const contact = parseContact(f.contact, f.contactType);
  const phone = normPhone(contact.phone);
  const nameKey = norm(f.fullName || '');
  const hits = new Set();
  if (phone && byPhone.has(phone)) hits.add(byPhone.get(phone));
  if (nameKey && byName.has(nameKey)) hits.add(byName.get(nameKey));
  if (hits.size === 1) pairs.push({ form: f, user: [...hits][0] });
}

console.log(`=== ${pairs.length} pairs ===\n`);
for (let i = 0; i < pairs.length; i++) {
  const { form, user } = pairs[i];
  console.log(`\n████ #${i+1}: ${form.fullName} (form ${form.id} → user ${user.uid})`);
  console.log(`\n-- CURRENT user --`);
  console.log(`  first/last: ${user.first || ''} ${user.last || ''}`);
  console.log(`  phone:      ${user.phone || '—'}`);
  console.log(`  email:      ${user.email || '—'}`);
  console.log(`  city:       ${user.city || '—'}`);
  console.log(`  categories: ${JSON.stringify(user.categories || [])}`);
  console.log(`  li:         ${user.li || '—'}`);
  console.log(`  website:    ${user.website || '—'}`);
  console.log(`  does:       ${user.does || '—'}`);
  console.log(`  needs:      ${user.needs || '—'}`);
  console.log(`  strength:   ${user.strength || '—'}`);
  console.log(`  canHelpWith:${user.canHelpWith || '—'}`);

  console.log(`\n-- FROM form --`);
  console.log(`  location:      ${form.location || '—'}`);
  console.log(`  mainField:     ${form.mainField || '—'}`);
  console.log(`  subField:      ${form.subField || '—'}`);
  console.log(`  whatTheyDo:    ${form.whatTheyDo || '—'}`);
  console.log(`  strength:      ${form.strength || '—'}`);
  console.log(`  canHelpWith:   ${form.canHelpWith || '—'}`);
  console.log(`  seeking:       ${form.seeking || '—'}`);
  console.log(`  specificNeed:  ${form.specificNeed || '—'}`);
  console.log(`  contact:       ${form.contact || '—'}`);

  // Compute enrichment (only-empty)
  const contactP = parseContact(form.contact, form.contactType);
  const updates = {};
  if (!isFilled(user.strength) && isMeaningful(form.strength)) updates.strength = form.strength;
  if (!isFilled(user.canHelpWith) && isMeaningful(form.canHelpWith)) updates.canHelpWith = form.canHelpWith;
  if (!isFilled(user.does) && isMeaningful(form.whatTheyDo)) updates.does = form.whatTheyDo;
  const userNeedsShort = !isFilled(user.needs) || String(user.needs).trim().length < NEEDS_MIN_LEN;
  if (userNeedsShort) { const p=[form.seeking,form.specificNeed].filter(isMeaningful); if(p.length) updates.needs = p.join('\n'); }
  if (!isFilled(user.city) && isMeaningful(form.location)) updates.city = form.location;
  if (!isFilled(user.li) && isFilled(contactP.li)) updates.li = contactP.li.startsWith('http')?contactP.li:'https://'+contactP.li;
  if (!isFilled(user.website) && isFilled(contactP.website)) updates.website = contactP.website.startsWith('http')?contactP.website:'https://'+contactP.website;

  console.log(`\n-- WILL UPDATE (only-empty fields) --`);
  if (Object.keys(updates).length === 0) {
    console.log(`  (nothing — user already has everything)`);
  } else {
    for (const [k,v] of Object.entries(updates)) {
      console.log(`  + ${k}:\n      ${String(v).replace(/\n/g,'\n      ')}`);
    }
  }
  console.log(`\n-- WILL MARK --  formRegistrants/${form.id} claimed=true claimedBy=${user.uid}\n`);
}
process.exit(0);
