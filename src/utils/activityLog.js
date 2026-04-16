import { db } from '../firebase';

export async function logActivity({ type, actorName, title, link }) {
  try {
    await db.addDoc('activityFeed', {
      type,
      actorName,
      title,
      link,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Activity logging is non-critical — fail silently
  }
}
