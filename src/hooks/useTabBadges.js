import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';

const TAB_CHECKS = [
  { path: '/forums', collection: 'forums', timeField: 'lastPostAt' },
  { path: '/messages', collection: 'conversations', timeField: 'lastMessageAt' },
  { path: '/journey', collection: 'journeyPosts', timeField: 'createdAt' },
];

function getSeenMap() {
  try {
    const raw = localStorage.getItem('bayit_seen');
    if (!raw) {
      const now = new Date().toISOString();
      const initial = {};
      TAB_CHECKS.forEach(({ path }) => {
        initial[path] = now;
      });
      initial['/matching'] = now;
      initial['/notifications'] = now;
      localStorage.setItem('bayit_seen', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function markSeen(tabPath) {
  const map = getSeenMap();
  map[tabPath] = new Date().toISOString();
  localStorage.setItem('bayit_seen', JSON.stringify(map));
}

export function useTabBadges(userId) {
  const location = useLocation();
  const [badges, setBadges] = useState({});
  const [notificationCount, setNotificationCount] = useState(0);
  const pathnameRef = useRef(location.pathname);

  // Mark current tab as seen on navigation (localStorage only)
  useEffect(() => {
    pathnameRef.current = location.pathname;
    const tab = '/' + (location.pathname.split('/')[1] || '');
    markSeen(tab);
    setBadges((prev) => ({ ...prev, [tab]: false }));
  }, [location.pathname]);

  // Periodic Firestore check for new content
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function check() {
      const seen = getSeenMap();
      const currentTab = '/' + (pathnameRef.current.split('/')[1] || '');
      const result = {};

      await Promise.all(
        TAB_CHECKS.map(async ({ path, collection, timeField }) => {
          if (path === currentTab) {
            result[path] = false;
            return;
          }
          try {
            let filters = [];
            if (path === '/messages') {
              filters = [{ field: 'participants', op: 'ARRAY_CONTAINS', value: userId }];
            }
            const docs = await db.getDocs(
              collection,
              filters,
              { field: timeField, direction: 'DESCENDING' },
              1,
            );
            const maxTime = docs.length > 0 ? docs[0].data()[timeField] || '' : '';
            result[path] = maxTime > (seen[path] || '');
          } catch {
            result[path] = false;
          }
        }),
      );

      // Notification count
      try {
        const notifDocs = await db.getDocs('notifications', [
          { field: 'userId', op: 'EQUAL', value: userId },
          { field: 'read', op: 'EQUAL', value: false },
        ]);
        if (!cancelled) setNotificationCount(notifDocs.length);
      } catch {
        if (!cancelled) setNotificationCount(0);
      }

      if (!cancelled) setBadges(result);
    }

    check();
    const interval = setInterval(check, 120000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  return { badges, notificationCount };
}
