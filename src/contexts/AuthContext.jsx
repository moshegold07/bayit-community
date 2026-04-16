import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';

const AuthContext = createContext({
  user: null,
  loading: true,
  refreshUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchUserDoc = useCallback(async (uid) => {
    const snap = await db.getDoc('users', uid);
    if (!snap.exists()) return null;
    return { uid, ...snap.data() };
  }, []);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setUser(null);
      return;
    }
    const userData = await fetchUserDoc(firebaseUser.uid);
    setUser(userData);
  }, [fetchUserDoc]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const userData = await fetchUserDoc(firebaseUser.uid);
        setUser(userData);
        setAuthError(null);
      } catch (e) {
        console.error('Failed to fetch user doc:', e);
        setAuthError(e.message);
        // Don't set user to null on transient errors — keep previous state
      }
      setLoading(false);
    });
    return unsub;
  }, [fetchUserDoc]);

  const isPending = user?.status === 'pending';
  const isActive = user?.status === 'active';

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, isPending, isActive, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
