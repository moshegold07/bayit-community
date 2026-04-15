import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'fake-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bayit-community',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Direct Firestore REST API wrapper — bypasses SDK connection issues
const PROJECT_ID = firebaseConfig.projectId;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

function parseFirestoreValue(val) {
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(parseFirestoreValue);
  if ('mapValue' in val) return parseFirestoreDoc(val.mapValue.fields || {});
  return val;
}

function parseFirestoreDoc(fields) {
  const result = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(val);
  }
  return result;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function firestoreRequest(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `${BASE}${path}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Firestore error ${res.status}`);
  }
  return res.json();
}

export const db = {
  async getDoc(collection, docId) {
    const data = await firestoreRequest(`/${collection}/${docId}`);
    if (!data) return { exists: () => false, data: () => null, id: docId };
    return {
      exists: () => !!data.fields,
      data: () => (data.fields ? parseFirestoreDoc(data.fields) : null),
      id: docId,
    };
  },

  async getDocs(collection, filters = [], orderBy = null) {
    // For sub-collection paths like "projects/abc/comments",
    // collectionId is the last segment; runQuery targets the parent doc path
    const segments = collection.split('/');
    const collectionId = segments.pop();
    const parentPath = segments.length > 0 ? '/' + segments.join('/') : '';
    const body = {
      structuredQuery: {
        from: [{ collectionId }],
        where: filters.length > 0 ? {
          compositeFilter: {
            op: 'AND',
            filters: filters.map(f => ({
              fieldFilter: { field: { fieldPath: f.field }, op: f.op, value: toFirestoreValue(f.value) }
            }))
          }
        } : undefined,
        orderBy: orderBy ? [{
          field: { fieldPath: orderBy.field },
          direction: orderBy.direction || 'DESCENDING',
        }] : undefined,
      }
    };
    const results = await firestoreRequest(`${parentPath}:runQuery`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return (results || [])
      .filter(r => r.document)
      .map(r => ({
        id: r.document.name.split('/').pop(),
        exists: () => true,
        data: () => parseFirestoreDoc(r.document.fields || {}),
      }));
  },

  async setDoc(collection, docId, data) {
    const fields = {};
    for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
    await firestoreRequest(`/${collection}/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
  },

  async updateDoc(collection, docId, data) {
    const fields = {};
    const fieldPaths = [];
    for (const [k, v] of Object.entries(data)) {
      fields[k] = toFirestoreValue(v);
      fieldPaths.push(k);
    }
    const mask = fieldPaths.map(f => `updateMask.fieldPaths=${f}`).join('&');
    await firestoreRequest(`/${collection}/${docId}?${mask}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
  },

  async deleteDoc(collection, docId) {
    await firestoreRequest(`/${collection}/${docId}`, { method: 'DELETE' });
  },

  async addDoc(collection, data) {
    const fields = {};
    for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
    const result = await firestoreRequest(`/${collection}`, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
    return result.name.split('/').pop();
  },
};
