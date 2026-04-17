import { db } from '../firebase';

export async function logActivity({ type, actorName, actorUid, title, link }) {
  try {
    await db.addDoc('activityFeed', {
      type,
      actorName,
      actorUid: actorUid || null,
      title,
      link,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Activity logging is non-critical — fail silently
  }
}
