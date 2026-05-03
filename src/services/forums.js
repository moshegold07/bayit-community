// forums service — `forums`, `forums/{id}/posts`, and
// `forums/{id}/posts/{postId}/replies` sub-collections.
// All counter increments (postCount, replyCount, lastPostAt) are caller-owned
// today; eventually they should move to a server-side trigger.

import { db } from '../firebase';

function mapDocs(docs) {
  return docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* -------------------------------------------------------------------------- */
/* Forums                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * List forums, newest-activity first.
 */
export async function listForums({ limit = 100 } = {}) {
  const docs = await db.getDocs(
    'forums',
    [],
    { field: 'lastPostAt', direction: 'DESCENDING' },
    limit,
  );
  return mapDocs(docs);
}

export async function getForum(forumId) {
  if (!forumId) return null;
  const snap = await db.getDoc('forums', forumId);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Create a forum topic.
 * @param {{ title: string, description?: string, createdBy: string, createdByName: string }} payload
 * @returns {Promise<{ id: string, data: object }>}
 */
export async function createForum(payload) {
  if (!payload?.title?.trim()) throw new Error('createForum: title required');
  const now = new Date().toISOString();
  const data = {
    title: payload.title.trim(),
    description: (payload.description || '').trim(),
    createdBy: payload.createdBy,
    createdByName: payload.createdByName || '',
    createdAt: now,
    lastPostAt: now,
    postCount: 0,
  };
  const id = await db.addDoc('forums', data);
  return { id, data };
}

export async function updateForum(forumId, patch) {
  if (!forumId) throw new Error('updateForum: id required');
  await db.updateDoc('forums', forumId, patch);
}

export async function deleteForum(forumId) {
  if (!forumId) throw new Error('deleteForum: id required');
  await db.deleteDoc('forums', forumId);
}

/* -------------------------------------------------------------------------- */
/* Posts                                                                      */
/* -------------------------------------------------------------------------- */

const postsPath = (forumId) => `forums/${forumId}/posts`;

/**
 * List posts in a forum, newest-first.
 */
export async function listPosts(forumId, { limit = null } = {}) {
  if (!forumId) throw new Error('listPosts: forumId required');
  const docs = await db.getDocs(
    postsPath(forumId),
    [],
    { field: 'createdAt', direction: 'DESCENDING' },
    limit,
  );
  return mapDocs(docs);
}

export async function getPost(forumId, postId) {
  if (!forumId || !postId) return null;
  const snap = await db.getDoc(postsPath(forumId), postId);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Create a post in a forum, then bump the parent forum's lastPostAt + postCount.
 * @param {string} forumId
 * @param {{ title: string, body: string, authorId: string, authorName: string }} payload
 * @param {{ currentForum?: object }} options if you already have the forum loaded,
 *   pass it in to save a re-read.
 */
export async function createPost(forumId, payload, { currentForum = null } = {}) {
  if (!forumId) throw new Error('createPost: forumId required');
  const now = new Date().toISOString();
  const data = {
    title: (payload.title || '').trim(),
    body: (payload.body || '').trim(),
    authorId: payload.authorId,
    authorName: payload.authorName || '',
    createdAt: now,
    replyCount: 0,
    lastReplyAt: now,
  };
  const id = await db.addDoc(postsPath(forumId), data);

  // Best-effort counter bump on the parent forum.
  let nextCount = 1;
  if (currentForum && typeof currentForum.postCount === 'number') {
    nextCount = currentForum.postCount + 1;
  } else {
    const fresh = await db.getDoc('forums', forumId);
    nextCount = (fresh.exists() && fresh.data()?.postCount ? fresh.data().postCount : 0) + 1;
  }
  await db.updateDoc('forums', forumId, { lastPostAt: now, postCount: nextCount });

  return { id, data };
}

export async function deletePost(forumId, postId) {
  if (!forumId || !postId) throw new Error('deletePost: ids required');
  await db.deleteDoc(postsPath(forumId), postId);
}

/* -------------------------------------------------------------------------- */
/* Replies                                                                    */
/* -------------------------------------------------------------------------- */

const repliesPath = (forumId, postId) => `forums/${forumId}/posts/${postId}/replies`;

export async function listReplies(forumId, postId) {
  if (!forumId || !postId) throw new Error('listReplies: ids required');
  const docs = await db.getDocs(
    repliesPath(forumId, postId),
    [],
    { field: 'createdAt', direction: 'ASCENDING' },
  );
  return mapDocs(docs);
}

/**
 * Create a reply on a post, then bump the post's replyCount + lastReplyAt.
 * @param {string} forumId
 * @param {string} postId
 * @param {{ body: string, authorId: string, authorName: string }} payload
 * @param {{ currentPost?: object }} options
 */
export async function createReply(forumId, postId, payload, { currentPost = null } = {}) {
  if (!forumId || !postId) throw new Error('createReply: ids required');
  const now = new Date().toISOString();
  const data = {
    body: (payload.body || '').trim(),
    authorId: payload.authorId,
    authorName: payload.authorName || '',
    createdAt: now,
  };
  const id = await db.addDoc(repliesPath(forumId, postId), data);

  const nextCount = (currentPost?.replyCount || 0) + 1;
  await db.updateDoc(`forums/${forumId}/posts`, postId, {
    replyCount: nextCount,
    lastReplyAt: now,
  });

  return { id, data };
}
