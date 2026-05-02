import { initializeApp, getApps, cert } from 'firebase-admin/app';
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

function readCode(req) {
  // Vercel normally exposes parsed query at req.query, but if it's not there
  // (raw URL parsing), fall back to manual URL parsing.
  let code = '';
  if (req.query && typeof req.query.code !== 'undefined') {
    const raw = req.query.code;
    code = String(Array.isArray(raw) ? raw[0] : raw || '').trim();
  }
  if (!code && req.url) {
    try {
      const parsed = new URL(req.url, 'http://x');
      code = String(parsed.searchParams.get('code') || '').trim();
    } catch {
      code = '';
    }
  }
  return code;
}

function isValidCode(code) {
  return typeof code === 'string' && code.length >= 10 && code.length <= 50;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const code = readCode(req);

  // Missing or malformed code → soft-redirect to root, no logging.
  if (!isValidCode(code)) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // Best-effort tracking: never block the redirect on a tracking failure.
  try {
    const app = getApp();
    const firestore = getFirestore(app);
    const userRef = firestore.collection('users').doc(code);
    const clickRef = firestore.collection('referralClicks').doc();
    const now = new Date().toISOString();
    const userAgent = req.headers['user-agent'] || null;

    await firestore.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      // Don't reveal validity to the caller — log nothing if the user is not
      // active, but still proceed to redirect.
      if (!userSnap.exists) return;
      const userData = userSnap.data() || {};
      if (userData.status !== 'active') return;

      const prevCount = Number(userData.shareClickCount) || 0;
      tx.update(userRef, {
        shareClickCount: prevCount + 1,
        lastShareClickAt: now,
      });
      tx.set(clickRef, {
        code,
        clickedAt: now,
        userAgent,
      });
    });
  } catch (err) {
    // Swallow — the redirect is the contract.
    console.error('[r.mjs] tracking failed', err?.message || err);
  }

  res.writeHead(302, { Location: '/?ref=' + encodeURIComponent(code) });
  res.end();
}

export const config = { runtime: 'nodejs' };
