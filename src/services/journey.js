// journey service — wraps the `journeyPosts` collection.
// Journey posts are short status-style updates from members.

import { db } from '../firebase';

function mapPosts(docs) {
  return docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * List journey posts, newest-first.
 * @param {{ limit?: number }} options
 */
export async function listJourneyPosts({ limit = 50 } = {}) {
  const docs = await db.getDocs(
    'journeyPosts',
    [],
    { field: 'createdAt', direction: 'DESCENDING' },
    limit,
  );
  return mapPosts(docs);
}

/**
 * Create a journey post.
 * @param {{ authorId: string, authorName: string, text: string }} payload
 * @returns {Promise<{ id: string, data: object }>}
 */
export async function createJourneyPost(payload) {
  const text = (payload?.text || '').trim();
  if (!text) throw new Error('createJourneyPost: text required');
  if (!payload.authorId) throw new Error('createJourneyPost: authorId required');
  const data = {
    authorId: payload.authorId,
    authorName: payload.authorName || '',
    text,
    createdAt: new Date().toISOString(),
  };
  const id = await db.addDoc('journeyPosts', data);
  return { id, data };
}

/**
 * Delete a journey post by id. Authorization (owner-or-admin) is the caller's
 * responsibility — services don't enforce policy.
 */
export async function deleteJourneyPost(postId) {
  if (!postId) throw new Error('deleteJourneyPost: id required');
  await db.deleteDoc('journeyPosts', postId);
}
