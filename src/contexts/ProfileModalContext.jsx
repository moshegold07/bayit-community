import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ProfileModalContext = createContext({
  openUid: null,
  openProfile: () => {},
  closeProfile: () => {},
});

export function ProfileModalProvider({ children }) {
  const [openUid, setOpenUid] = useState(null);

  const openProfile = useCallback((uid) => {
    if (!uid) return;
    setOpenUid(uid);
  }, []);

  const closeProfile = useCallback(() => setOpenUid(null), []);

  const value = useMemo(
    () => ({ openUid, openProfile, closeProfile }),
    [openUid, openProfile, closeProfile],
  );

  return <ProfileModalContext.Provider value={value}>{children}</ProfileModalContext.Provider>;
}

export function useProfileModal() {
  return useContext(ProfileModalContext);
}
