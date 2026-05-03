import { vi } from 'vitest';

/**
 * Creates a reusable Firebase mock matching the shape of /src/firebase.js.
 *
 * The real `db.getDoc(collection, id)` returns:
 *   { exists: () => boolean, data: () => object | null, id }
 *
 * `auth.onAuthStateChanged(cb)` invokes the callback synchronously with the
 * supplied `user` (or null) and returns an unsubscribe function.
 *
 * @param {Object} opts
 * @param {Object|null} opts.user   Firebase user object (must include `uid`) or null
 * @param {string}      opts.role   Role stored in users/{uid} doc (default: 'member')
 * @param {string}      opts.status Status stored in users/{uid} doc (default: 'active')
 */
export function createFirebaseMock({ user = null, role = 'member', status = 'active' } = {}) {
  const userDoc = user
    ? { uid: user.uid, role, status, name: 'Test', email: user.email || 'test@example.com' }
    : null;

  return {
    auth: {
      currentUser: user,
      onAuthStateChanged: (cb) => {
        cb(user);
        return () => {};
      },
    },
    db: {
      getDoc: vi.fn(async (col, id) => {
        if (col === 'users' && user && id === user.uid) {
          return {
            exists: () => true,
            data: () => userDoc,
            id,
          };
        }
        return { exists: () => false, data: () => null, id };
      }),
      getDocs: vi.fn(async () => []),
      addDoc: vi.fn(async () => 'new-id'),
      updateDoc: vi.fn(async () => undefined),
      setDoc: vi.fn(async () => undefined),
      deleteDoc: vi.fn(async () => undefined),
    },
  };
}
