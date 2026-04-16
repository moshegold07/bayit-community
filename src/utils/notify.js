import { db } from '../firebase';

export async function createNotification({ userId, type, title, body, link }) {
  try {
    await db.addDoc('notifications', {
      userId,
      type,
      title,
      body: body || '',
      link: link || '',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Notification creation is non-critical
  }
}
