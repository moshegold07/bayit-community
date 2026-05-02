import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function getApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
  let credentials;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON');
  }
  return initializeApp({ credential: cert(credentials) });
}

function isHttpUrl(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim().toLowerCase();
  return t.startsWith('http://') || t.startsWith('https://');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const app = getApp();
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return;
    }
    const decoded = await getAuth(app).verifyIdToken(idToken);
    const uid = decoded.uid;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const title = String(body.title || '').trim();
    const story = String(body.story || '').trim();
    const category = String(body.category || '').trim();
    const link = String(body.link || '').trim();

    if (!title || title.length > 200) {
      res.status(400).json({ error: 'כותרת חסרה או ארוכה מדי' });
      return;
    }
    if (!story || story.length > 5000) {
      res.status(400).json({ error: 'סיפור חסר או ארוך מדי' });
      return;
    }
    if (!category) {
      res.status(400).json({ error: 'יש לבחור קטגוריה' });
      return;
    }
    if (!isHttpUrl(link)) {
      res.status(400).json({ error: 'יש להזין קישור תקין (http/https)' });
      return;
    }

    const firestore = getFirestore(app);

    const userSnap = await firestore.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      res.status(403).json({ error: 'משתמש לא נמצא' });
      return;
    }
    const userData = userSnap.data();
    if (userData.status !== 'active') {
      res.status(403).json({ error: 'רק חברים פעילים יכולים להוסיף מיזם' });
      return;
    }
    const isAdmin = userData.role === 'admin';
    const userScore = Number(userData.score) || 0;
    if (!isAdmin && userScore < 10) {
      res.status(403).json({
        error: 'דרושים לפחות 10 נקודות (50 חברים שמצטרפים דרך הקישור האישי) כדי לשתף מיזם',
        code: 'insufficient_score',
      });
      return;
    }
    const createdByName = `${userData.first || ''} ${userData.last || ''}`.trim() || 'חבר';

    const counterRef = firestore.collection('settings').doc('ventureCounter');
    const ventureRef = firestore.collection('ventures').doc();
    const now = new Date().toISOString();

    const queueNumber = await firestore.runTransaction(async (tx) => {
      const counter = await tx.get(counterRef);
      const current = counter.exists ? Number(counter.data().value) || 0 : 0;
      const next = current + 1;
      tx.set(counterRef, { value: next, updatedAt: now }, { merge: true });
      tx.set(ventureRef, {
        queueNumber: next,
        title,
        story,
        category,
        link,
        createdBy: uid,
        createdByName,
        createdAt: now,
        status: 'pending',
        distributedAt: null,
      });
      return next;
    });

    res.status(200).json({ id: ventureRef.id, queueNumber });
  } catch (err) {
    const code = err?.code || 'internal';
    const status = code === 'auth/id-token-expired' || code === 'auth/argument-error' ? 401 : 500;
    res.status(status).json({ error: err.message || 'שגיאה פנימית', code });
  }
}

export const config = { runtime: 'nodejs' };
