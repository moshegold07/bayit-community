#!/usr/bin/env node
// Pull Google Form responses → Firestore formRegistrants (idempotent).
// Usage:
//   node scripts/pull-form-responses.mjs              # dry-run (default)
//   node scripts/pull-form-responses.mjs --execute    # write to Firestore
//
// Requires: GOOGLE_APPLICATION_CREDENTIALS pointing to the Firebase SA key
// (which is also shared as Viewer on the responses Sheet).

import { google } from 'googleapis';
import admin from 'firebase-admin';

const SHEET_ID = '1FscPo0AWhu5GUvVCcLOKGaL99UShE2WBCC3MUg7OkUQ';
const TAB = 'תגובות לטופס 1';
const EXECUTE = process.argv.includes('--execute');

const COLS = {
  timestamp: 0,
  fullName: 1,
  location: 2,
  contact: 3,
  mainField: 4,
  whatTheyDo: 5,
  strength: 6,
  canHelpWith: 7,
  seeking: 8,
  specificNeed: 9,
};

function normalizePhone(s) {
  const digits = String(s || '').replace(/\D/g, '');
  if (digits.length < 9) return '';
  return digits.slice(-9); // last 9 digits = unique Israeli phone core
}

function normalizeName(s) {
  return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function inferContactType(contact) {
  const c = String(contact || '').toLowerCase();
  if (!c) return '📌 אחר';
  if (c.includes('wa.me') || c.includes('whatsapp') || c.includes('וואטסאפ')) return '💬 WhatsApp';
  if (c.includes('linkedin.com')) return '🔗 LinkedIn';
  if (/\d{9,}/.test(c) && !c.startsWith('http')) return '📞 טלפון';
  if (c.startsWith('http')) return '🌐 אתר';
  return '📌 אחר';
}

function parseTimestamp(s) {
  const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, d, mo, y, h, mi, se] = m;
  return new Date(
    `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${mi}:${se}+03:00`
  ).toISOString();
}

async function fetchSheetRows() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:Z`,
  });
  const all = res.data.values || [];
  return all.slice(1); // drop header
}

async function fetchExisting(db) {
  const snap = await db.collection('formRegistrants').get();
  const byPhone = new Map();
  const byName = new Map();
  snap.docs.forEach((d) => {
    const x = d.data();
    const phone = normalizePhone(x.contact);
    if (phone) byPhone.set(phone, { id: d.id, name: x.fullName });
    const name = normalizeName(x.fullName);
    if (name) byName.set(name, { id: d.id, name: x.fullName });
  });
  return { byPhone, byName, total: snap.size };
}

function rowToRecord(row) {
  const contact = (row[COLS.contact] || '').trim();
  return {
    fullName: (row[COLS.fullName] || '').trim(),
    location: (row[COLS.location] || '').trim(),
    contact,
    contactType: inferContactType(contact),
    mainField: (row[COLS.mainField] || '').trim(),
    subField: '',
    whatTheyDo: (row[COLS.whatTheyDo] || '').trim(),
    strength: (row[COLS.strength] || '').trim(),
    canHelpWith: (row[COLS.canHelpWith] || '').trim(),
    seeking: (row[COLS.seeking] || '').trim(),
    specificNeed: (row[COLS.specificNeed] || '').trim(),
    claimed: false,
    submittedAt: parseTimestamp(row[COLS.timestamp]),
    importedAt: new Date().toISOString(),
    source: 'google-form-pull',
  };
}

async function main() {
  admin.initializeApp();
  const db = admin.firestore();

  const [rows, existing] = await Promise.all([fetchSheetRows(), fetchExisting(db)]);

  console.log(`📋 Sheet rows:           ${rows.length}`);
  console.log(`🗄️  Firestore existing:   ${existing.total}`);
  console.log('');

  const toInsert = [];
  const skipped = [];

  for (const row of rows) {
    const rec = rowToRecord(row);
    if (!rec.fullName) continue;

    const phone = normalizePhone(rec.contact);
    const nameKey = normalizeName(rec.fullName);

    let match = null;
    if (phone && existing.byPhone.has(phone)) match = { by: 'phone', ...existing.byPhone.get(phone) };
    else if (nameKey && existing.byName.has(nameKey)) match = { by: 'name', ...existing.byName.get(nameKey) };

    if (match) {
      skipped.push({ fullName: rec.fullName, by: match.by });
      continue;
    }
    toInsert.push(rec);
  }

  console.log(`🟢 New to insert:  ${toInsert.length}`);
  console.log(`⏭️  Already exist:  ${skipped.length}`);
  console.log('');

  if (toInsert.length) {
    console.log('─── New records preview ───');
    toInsert.forEach((r, i) => {
      const c = (r.contact || '(no contact)').slice(0, 50);
      console.log(`${String(i + 1).padStart(2)}. ${r.fullName} | ${r.location} | ${r.contactType} | ${r.mainField}`);
      console.log(`    contact: ${c}`);
    });
    console.log('');
  }

  if (!EXECUTE) {
    console.log('💡 [DRY RUN] pass --execute to write to Firestore');
    return;
  }

  console.log(`✍️  Writing ${toInsert.length} records to Firestore...`);
  const BATCH_SIZE = 400;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = db.batch();
    toInsert.slice(i, i + BATCH_SIZE).forEach((r) => {
      const ref = db.collection('formRegistrants').doc();
      batch.set(ref, r);
    });
    await batch.commit();
  }
  console.log(`✅ Inserted ${toInsert.length} new records.`);
}

main().catch((e) => {
  console.error('ERROR:', e.message || e);
  process.exit(1);
});
