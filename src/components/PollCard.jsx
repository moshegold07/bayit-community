import { useState } from 'react';
import { s, BLUE } from './shared';
import AdminContentAction, { HiddenBadge, hiddenItemStyle } from './AdminContentAction';

function formatDateHebrew(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getVoteCounts(poll) {
  const counts = {};
  let total = 0;
  const voters = new Set();
  const options = poll.options || [];
  for (let i = 0; i < options.length; i++) {
    const key = String(i);
    const uids = Array.isArray((poll.votes || {})[key]) ? poll.votes[key] : [];
    counts[i] = uids.length;
    total += uids.length;
    uids.forEach((uid) => voters.add(uid));
  }
  return { counts, total, voterCount: voters.size };
}

function getUserVotedIndices(poll, userId) {
  if (!userId) return [];
  const indices = [];
  const options = poll.options || [];
  for (let i = 0; i < options.length; i++) {
    const key = String(i);
    const uids = Array.isArray((poll.votes || {})[key]) ? poll.votes[key] : [];
    if (uids.includes(userId)) indices.push(i);
  }
  return indices;
}

export default function PollCard({ poll, currentUserId, onVote, onToggleHidden, onDelete }) {
  const [selectedMulti, setSelectedMulti] = useState([]);
  const [submittingMulti, setSubmittingMulti] = useState(false);

  const options = poll.options || [];
  const { counts, total, voterCount } = getVoteCounts(poll);
  const userVoted = getUserVotedIndices(poll, currentUserId);
  const hasVoted = userVoted.length > 0;

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
  const canVote = !hasVoted && !isExpired;

  function handleSingleVote(index) {
    if (!canVote || poll.multiSelect) return;
    onVote(poll.id, index);
  }

  function toggleMultiOption(index) {
    setSelectedMulti((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  }

  async function handleMultiSubmit() {
    if (selectedMulti.length === 0 || submittingMulti) return;
    setSubmittingMulti(true);
    await onVote(poll.id, selectedMulti);
    setSelectedMulti([]);
    setSubmittingMulti(false);
  }

  const showResults = hasVoted || isExpired;

  return (
    <div style={{ ...s.card, direction: 'rtl', ...hiddenItemStyle(poll.hidden) }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 16, color: '#222', flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          {poll.question}
          {poll.hidden && <HiddenBadge />}
        </div>
        {isExpired && (
          <span
            style={{
              fontSize: 11,
              padding: '2px 9px',
              borderRadius: 20,
              background: '#FEE2E2',
              color: '#991B1B',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            הסתיים
          </span>
        )}
        {poll.multiSelect && <span style={{ ...s.tag, flexShrink: 0 }}>בחירה מרובה</span>}
      </div>

      {/* Meta */}
      <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
        {poll.createdByName || 'אנונימי'} &middot; {formatDateHebrew(poll.createdAt)}
        {poll.expiresAt && !isExpired && (
          <span> &middot; נסגר ב-{formatDateHebrew(poll.expiresAt)}</span>
        )}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, i) => {
          const count = counts[i] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isUserChoice = userVoted.includes(i);
          const isMultiSelected = selectedMulti.includes(i);

          const barColor = isUserChoice ? BLUE : '#f0f0ee';
          const textColor = isUserChoice ? BLUE : '#444';

          if (showResults) {
            // Results view
            return (
              <div key={i} style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: pct + '%',
                    background: barColor,
                    borderRadius: 8,
                    opacity: isUserChoice ? 0.15 : 1,
                    transition: 'width 0.3s ease',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: isUserChoice ? `2px solid ${BLUE}` : '1px solid #E8E5DE',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: isUserChoice ? 600 : 400, color: textColor }}>
                    {opt}
                  </span>
                  <span style={{ fontSize: 12, color: '#888', flexShrink: 0, marginLeft: 8 }}>
                    {count} ({pct}%)
                  </span>
                </div>
              </div>
            );
          }

          // Voting view
          if (poll.multiSelect) {
            return (
              <label
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: isMultiSelected ? `2px solid ${BLUE}` : '1px solid #E8E5DE',
                  background: isMultiSelected ? '#EDF4FB' : '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  fontSize: 14,
                  color: '#444',
                }}
              >
                <input
                  type="checkbox"
                  checked={isMultiSelected}
                  onChange={() => toggleMultiOption(i)}
                  style={{ accentColor: BLUE }}
                />
                {opt}
              </label>
            );
          }

          // Single select
          return (
            <div
              key={i}
              onClick={() => handleSingleVote(i)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #E8E5DE',
                background: '#fff',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                fontSize: 14,
                color: '#444',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BLUE;
                e.currentTarget.style.background = '#EDF4FB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E8E5DE';
                e.currentTarget.style.background = '#fff';
              }}
            >
              {opt}
            </div>
          );
        })}
      </div>

      {/* Multi-select submit button */}
      {canVote && poll.multiSelect && (
        <button
          onClick={handleMultiSubmit}
          disabled={selectedMulti.length === 0 || submittingMulti}
          style={{
            marginTop: 10,
            padding: '8px 20px',
            background: selectedMulti.length > 0 ? BLUE : '#ccc',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: selectedMulti.length > 0 ? 'pointer' : 'not-allowed',
            opacity: submittingMulti ? 0.6 : 1,
          }}
        >
          {submittingMulti ? 'שולח...' : 'שלח הצבעה'}
        </button>
      )}

      {/* Footer: total votes */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 8,
          borderTop: '0.5px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#aaa',
        }}
      >
        <span>{voterCount} מצביעים</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AdminContentAction
            collection="polls"
            docId={poll.id}
            hidden={poll.hidden}
            onToggleHidden={onToggleHidden}
            onDelete={onDelete}
          />
          <span>{total} הצבעות</span>
        </div>
      </div>
    </div>
  );
}
