// ventures service — wraps Firestore access for `ventures` collection.
// `createVenture` is special: it does NOT write to Firestore directly,
// it calls the server `/api/claim-queue-number` endpoint which atomically
// allocates a queue number and writes the doc server-side.

import { db, auth } from '../firebase';

function mapVentures(docs) {
  return docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * List ventures (newest-first if you supply orderBy in caller — default no order).
 * @param {{ limit?: number }} options
 */
export async function listVentures({ limit = 100 } = {}) {
  const docs = await db.getDocs('ventures', [], null, limit);
  return mapVentures(docs);
}

/**
 * List ventures filtered by status (e.g. 'open', 'distributed').
 */
export async function listVenturesByStatus(status, { limit = 100 } = {}) {
  if (!status) return listVentures({ limit });
  const docs = await db.getDocs(
    'ventures',
    [{ field: 'status', op: 'EQUAL', value: status }],
    null,
    limit,
  );
  return mapVentures(docs);
}

/**
 * Get a single venture by id, or null.
 */
export async function getVenture(id) {
  if (!id) return null;
  const snap = await db.getDoc('ventures', id);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Create a venture via the server endpoint that atomically claims a queue number.
 * The endpoint expects a Firebase ID token in `Authorization: Bearer ...`.
 *
 * @param {{ title: string, story: string, category: string, link?: string }} payload
 * @returns {Promise<{ id: string, queueNumber?: number }>} server response
 */
export async function createVenture(payload) {
  if (!payload?.title?.trim()) throw new Error('createVenture: title required');
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('createVenture: not authenticated');
  const idToken = await currentUser.getIdToken();
  const res = await fetch('/api/claim-queue-number', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      title: payload.title.trim(),
      story: (payload.story || '').trim(),
      category: payload.category || '',
      link: (payload.link || '').trim(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `claim-queue-number failed: ${res.status}`);
  }
  return data;
}

/**
 * Patch fields on an existing venture (status, distributedAt, etc).
 */
export async function updateVenture(id, patch) {
  if (!id) throw new Error('updateVenture: id required');
  if (!patch || typeof patch !== 'object') throw new Error('updateVenture: patch required');
  await db.updateDoc('ventures', id, patch);
}

/**
 * Mark a venture as distributed (helper around updateVenture).
 */
export async function markVentureDistributed(id) {
  return updateVenture(id, {
    status: 'distributed',
    distributedAt: new Date().toISOString(),
  });
}

/** Reopen a venture that was previously distributed/closed. */
export async function reopenVenture(id) {
  return updateVenture(id, { status: 'open', distributedAt: null });
}
