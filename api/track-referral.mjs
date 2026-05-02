import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

// New users have a 5-minute window after createdAt during which a referral
// can be attached. This blocks retroactive ref-code stuffing on old accounts.
const REFERRAL_WINDOW_MS = 5 * 60 * 1000;

function parseCreatedAt(value) {
  if (!value) return null;
  // Firestore Admin Timestamp
  if (typeof value === 'object' && typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  // ISO string (existing claim-queue-number style)
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  // raw epoch ms
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
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
    const referrerUid = String(body.referrerUid || '').trim();

    if (!referrerUid) {
      res.status(400).json({ error: 'חסר קוד הפניה' });
      return;
    }
    if (referrerUid.length < 10 || referrerUid.length > 50) {
      res.status(400).json({ error: 'קוד הפניה לא תקין' });
      return;
    }
    if (referrerUid === uid) {
      res.status(400).json({ error: 'לא ניתן להפנות את עצמך' });
      return;
    }

    const firestore = getFirestore(app);
    const newUserRef = firestore.collection('users').doc(uid);
    const referrerRef = firestore.collection('users').doc(referrerUid);

    // Pre-flight reads (also done inside tx for atomicity, but we want to
    // return the soft-fail reasons quickly without touching the transaction).
    const [newUserSnap, referrerSnap] = await Promise.all([
      newUserRef.get(),
      referrerRef.get(),
    ]);

    if (!newUserSnap.exists) {
      res.status(403).json({ error: 'משתמש לא נמצא' });
      return;
    }

    const newUserData = newUserSnap.data() || {};
    if (newUserData.referredBy) {
      res.status(200).json({ ok: false, reason: 'already_referred' });
      return;
    }

    const createdAtMs = parseCreatedAt(newUserData.createdAt);
    if (createdAtMs == null) {
      res.status(200).json({ ok: false, reason: 'expired_window' });
      return;
    }
    if (Date.now() - createdAtMs > REFERRAL_WINDOW_MS) {
      res.status(200).json({ ok: false, reason: 'expired_window' });
      return;
    }

    if (!referrerSnap.exists) {
      res.status(200).json({ ok: false, reason: 'invalid_ref' });
      return;
    }
    const referrerData = referrerSnap.data() || {};
    if (referrerData.status !== 'active') {
      res.status(200).json({ ok: false, reason: 'referrer_not_active' });
      return;
    }

    const now = new Date().toISOString();

    const result = await firestore.runTransaction(async (tx) => {
      const [freshNew, freshReferrer] = await Promise.all([
        tx.get(newUserRef),
        tx.get(referrerRef),
      ]);
      if (!freshNew.exists) {
        return { ok: false, reason: 'invalid_ref' };
      }
      const freshNewData = freshNew.data() || {};
      if (freshNewData.referredBy) {
        return { ok: false, reason: 'already_referred' };
      }
      const freshCreatedAtMs = parseCreatedAt(freshNewData.createdAt);
      if (freshCreatedAtMs == null || Date.now() - freshCreatedAtMs > REFERRAL_WINDOW_MS) {
        return { ok: false, reason: 'expired_window' };
      }
      if (!freshReferrer.exists) {
        return { ok: false, reason: 'invalid_ref' };
      }
      const freshReferrerData = freshReferrer.data() || {};
      if (freshReferrerData.status !== 'active') {
        return { ok: false, reason: 'referrer_not_active' };
      }

      const prevCount = Number(freshReferrerData.referredCount) || 0;
      const newCount = prevCount + 1;
      // 1 friend = 1 point. 10 friends unlocks venture sharing.
      const newScore = newCount;

      tx.update(newUserRef, {
        referredBy: referrerUid,
      });
      tx.update(referrerRef, {
        referredCount: newCount,
        score: newScore,
        lastReferralAt: now,
      });

      return { ok: true, newScore, newCount };
    });

    res.status(200).json(result);
  } catch (err) {
    const code = err?.code || 'internal';
    const status = code === 'auth/id-token-expired' || code === 'auth/argument-error' ? 401 : 500;
    res.status(status).json({ error: err.message || 'שגיאה פנימית', code });
  }
}

export const config = { runtime: 'nodejs' };
