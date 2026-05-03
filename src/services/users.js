// users service — wraps Firestore REST access for the `users` collection.
// Pure async functions; no React, no side effects beyond DB calls.
// Always returns plain objects (id + data) so components don't deal with snapshots.

import { db } from '../firebase';

/** Map a Firestore snapshot array to plain objects keyed by uid. */
function mapUsers(docs) {
  return docs.map((d) => ({ uid: d.id, ...d.data() }));
}

/**
 * List active users (status === 'active').
 * @param {{ limit?: number }} options
 * @returns {Promise<Array<object>>}
 */
export async function listActiveUsers({ limit = 200 } = {}) {
  const docs = await db.getDocs(
    'users',
    [{ field: 'status', op: 'EQUAL', value: 'active' }],
    null,
    limit,
  );
  return mapUsers(docs);
}

/**
 * List pending registrants (status === 'pending').
 * @param {{ limit?: number }} options
 */
export async function listPendingUsers({ limit = 200 } = {}) {
  const docs = await db.getDocs(
    'users',
    [{ field: 'status', op: 'EQUAL', value: 'pending' }],
    null,
    limit,
  );
  return mapUsers(docs);
}

/**
 * Get a single user by uid. Returns null if the doc does not exist.
 */
export async function getUser(uid) {
  if (!uid) return null;
  const snap = await db.getDoc('users', uid);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() };
}

/**
 * Patch arbitrary fields on a user doc.
 * Throws on error — callers decide how to surface failures.
 */
export async function updateUser(uid, patch) {
  if (!uid) throw new Error('updateUser: uid required');
  if (!patch || typeof patch !== 'object') throw new Error('updateUser: patch required');
  await db.updateDoc('users', uid, patch);
}

/**
 * Create-or-overwrite a user doc.
 * Use this only during registration / admin imports.
 */
export async function setUser(uid, data) {
  if (!uid) throw new Error('setUser: uid required');
  await db.setDoc('users', uid, data);
}

/**
 * Client-side prefix search across active users.
 *
 * NOTE: Firestore has no native `startsWith` — we fetch a bounded slice and
 * filter in memory. This is a placeholder; for real prefix search we need
 * either a denormalized lowercase field + range query (`>= prefix && < prefix`)
 * or an external index (Algolia / Typesense / Postgres on the backend).
 *
 * @param {string} prefix
 * @param {{ limit?: number }} options
 */
export async function searchUsersByName(prefix, { limit = 500 } = {}) {
  const needle = (prefix || '').trim().toLowerCase();
  if (!needle) return [];
  const all = await listActiveUsers({ limit });
  return all.filter((u) => {
    const full = `${u.first || ''} ${u.last || ''}`.trim().toLowerCase();
    return full.startsWith(needle) || (u.name || '').toLowerCase().startsWith(needle);
  });
}

/** Mark a user inactive without deleting the doc (soft-delete). */
export async function deactivateUser(uid) {
  return updateUser(uid, { status: 'inactive' });
}

/** Approve a pending registrant. */
export async function approveUser(uid) {
  return updateUser(uid, { status: 'active' });
}
