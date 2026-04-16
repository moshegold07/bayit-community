import { useState } from 'react';
import { db } from '../firebase';
import { BLUE } from './shared';

const AV = ['#1A8A7D', '#2A5A8A', '#8B6AAE', '#C47A3A', '#5A8A6A'];
function avColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV[h % 5];
}

export default function GroupCreateModal({ members, currentUser, onClose, onCreated }) {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filtered = members.filter(
    (m) =>
      m.uid !== currentUser.uid &&
      ((m.first || '') + ' ' + (m.last || '')).toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(uid) {
    setSelected((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  }

  async function handleSubmit() {
    if (!groupName.trim() || selected.length < 2) return;
    setLoading(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const participants = [currentUser.uid, ...selected];
      const participantNames = {
        [currentUser.uid]: (currentUser.first || '') + ' ' + (currentUser.last || ''),
      };
      const selectedMembers = members.filter((m) => selected.includes(m.uid));
      selectedMembers.forEach((m) => {
        participantNames[m.uid] = (m.first || '') + ' ' + (m.last || '');
      });
      const id = await db.addDoc('conversations', {
        participants,
        participantNames,
        groupName: groupName.trim(),
        isGroup: true,
        lastMessage: '',
        lastMessageAt: now,
        createdAt: now,
      });
      onCreated(id);
    } catch (err) {
      console.error('Create group error:', err);
      setError('שגיאה ביצירת הקבוצה: ' + (err.message || 'נסה שוב'));
    }
    setLoading(false);
  }

  const canSubmit = groupName.trim() && selected.length >= 2 && !loading;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E8E5DE',
          padding: '1.5rem',
          width: '100%',
          maxWidth: 520,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '0.5px solid #eee',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE }} />
            <span style={{ fontWeight: 500, fontSize: 16 }}>קבוצה חדשה</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#888',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Group name input */}
        <input
          dir="auto"
          placeholder="שם הקבוצה"
          maxLength={50}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '1px solid #D5D0C8',
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'sans-serif',
            boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />

        {/* Search members */}
        <input
          dir="auto"
          placeholder="חיפוש חברים..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '1px solid #D5D0C8',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'sans-serif',
            boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />

        {/* Selected count */}
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
          נבחרו {selected.length} חברים (מינימום 2)
        </div>

        {/* Member list */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 120, maxHeight: 280 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '1rem 0', fontSize: 13 }}>
              לא נמצאו חברים
            </div>
          ) : (
            filtered.map((m) => {
              const name = (m.first || '') + ' ' + (m.last || '');
              const initials = name
                .split(' ')
                .map((p) => p[0] || '')
                .join('');
              const isSelected = selected.includes(m.uid);
              return (
                <div
                  key={m.uid}
                  onClick={() => toggle(m.uid)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 6px',
                    cursor: 'pointer',
                    borderRadius: 8,
                    background: isSelected ? '#EDF4FB' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    style={{ accentColor: BLUE, cursor: 'pointer' }}
                  />
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: avColor(m.uid),
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <span style={{ fontSize: 14, color: '#222' }}>{name}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '8px 12px',
              marginTop: 8,
              color: '#991B1B',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: 12,
            padding: '8px 20px',
            background: BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: canSubmit ? 'pointer' : 'default',
            opacity: canSubmit ? 1 : 0.5,
            alignSelf: 'flex-start',
            fontWeight: 500,
          }}
        >
          {loading ? 'יוצר...' : 'צור קבוצה'}
        </button>
      </div>
    </div>
  );
}
