// notifications service — wraps the `notifications` collection.
// Each doc has at minimum: { userId, read, createdAt, link?, type?, ... }

import { db } from '../firebase';

function mapNotifs(docs) {
  return docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * List a user's notifications (most recent first).
 * Falls back to client-side sort if the orderBy query fails (missing index).
 *
 * @param {string} userId
 * @param {{ limit?: number }} options
 */
export async function listForUser(userId, { limit = null } = {}) {
  if (!userId) throw new Error('listForUser: userId required');
  try {
    const docs = await db.getDocs(
      'notifications',
      [{ field: 'userId', op: 'EQUAL', value: userId }],
      { field: 'createdAt', direction: 'DESCENDING' },
      limit,
    );
    return mapNotifs(docs);
  } catch (err) {
    // Composite index might be missing — fall back to filter-only and sort in memory.
    const docs = await db.getDocs('notifications', [
      { field: 'userId', op: 'EQUAL', value: userId },
    ]);
    const items = mapNotifs(docs);
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (limit) return items.slice(0, limit);
    return items;
  }
}

/**
 * List a user's UNREAD notifications.
 * @param {string} userId
 * @param {{ limit?: number }} options
 */
export async function listUnread(userId, { limit = 20 } = {}) {
  if (!userId) throw new Error('listUnread: userId required');
  const all = await listForUser(userId, { limit: null });
  const unread = all.filter((n) => !n.read);
  return limit ? unread.slice(0, limit) : unread;
}

/**
 * Mark a single notification as read.
 */
export async function markRead(notificationId) {
  if (!notificationId) throw new Error('markRead: id required');
  await db.updateDoc('notifications', notificationId, { read: true });
}

/**
 * Mark all of a user's unread notifications as read.
 * Returns the number of docs updated.
 */
export async function markAllRead(userId) {
  if (!userId) throw new Error('markAllRead: userId required');
  const unread = await listUnread(userId, { limit: null });
  if (unread.length === 0) return 0;
  await Promise.all(unread.map((n) => db.updateDoc('notifications', n.id, { read: true })));
  return unread.length;
}

/**
 * Count unread notifications without fetching full bodies.
 * Today this still pulls all matching docs (Firestore REST has no count API
 * exposed in our wrapper); good enough for badge counts in the low-hundreds.
 */
export async function countUnread(userId) {
  const unread = await listUnread(userId, { limit: null });
  return unread.length;
}
