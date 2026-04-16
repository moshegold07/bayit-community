import { useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const BTN_BASE = {
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
  fontWeight: 500,
  border: 'none',
};

export function HiddenBadge() {
  return (
    <span
      style={{
        fontSize: 10,
        background: '#FEF3CD',
        color: '#856404',
        borderRadius: 10,
        padding: '1px 7px',
        fontWeight: 500,
      }}
    >
      מוסתר
    </span>
  );
}

export function hiddenItemStyle(isHidden) {
  if (!isHidden) return {};
  return {
    opacity: 0.55,
    borderRight: '3px solid #E2A03F',
  };
}

export function filterHidden(items, isAdmin) {
  if (isAdmin) return items;
  return items.filter((item) => !item.hidden);
}

export default function AdminContentAction({ collection, docId, hidden, onToggleHidden, onDelete }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!user || user.role !== 'admin') return null;

  async function handleToggle(e) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      if (hidden) {
        await db.updateDoc(collection, docId, { hidden: false });
      } else {
        await db.updateDoc(collection, docId, {
          hidden: true,
          hiddenAt: now,
          hiddenBy: user.uid,
        });
      }
      onToggleHidden(!hidden);
    } catch (err) {
      console.error('Toggle hidden error:', err);
    }
    setBusy(false);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    if (!window.confirm('למחוק לצמיתות? לא ניתן לשחזר.')) return;
    setBusy(true);
    try {
      await db.deleteDoc(collection, docId);
      onDelete();
    } catch (err) {
      console.error('Delete content error:', err);
    }
    setBusy(false);
  }

  return (
    <div
      style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleToggle}
        disabled={busy}
        style={{
          ...BTN_BASE,
          background: hidden ? '#D4EDDA' : '#FFF3CD',
          color: hidden ? '#155724' : '#856404',
          opacity: busy ? 0.5 : 1,
        }}
      >
        {busy ? '...' : hidden ? 'הצג מחדש' : 'הסתר'}
      </button>
      <button
        onClick={handleDelete}
        disabled={busy}
        style={{
          ...BTN_BASE,
          background: '#F8D7DA',
          color: '#721C24',
          opacity: busy ? 0.5 : 1,
        }}
      >
        {busy ? '...' : 'מחק'}
      </button>
    </div>
  );
}
