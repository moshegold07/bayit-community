import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { s, Header, BLUE } from '../components/shared';

const AV_COLORS = ['#1A6FBF', '#0F4F8A', '#1A8080', '#7A4F9A', '#B05020'];
function avColor(id) {
  let h = 0;
  for (let c of id || '') h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV_COLORS[h % 5];
}
function initials(m) {
  return (m.first?.[0] || '') + (m.last?.[0] || '');
}

function UserModal({ user: u, onClose, onApprove, onDelete }) {
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
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '1.5rem',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '0.5px solid #eee',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: avColor(u.phone || u.uid),
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {initials(u)}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 17 }}>
              {u.first} {u.last}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {u.city || ''}
              {u.city && u.domain ? ' · ' : ''}
              {u.domain || ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginRight: 'auto',
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: '#aaa',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          {[
            [
              'טלפון',
              <span
                key="phone"
                style={{ fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}
              >
                {u.phone}
              </span>,
            ],
            ['אימייל', u.email],
            [
              'אתר',
              u.website ? (
                <a
                  key="website"
                  href={u.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: BLUE }}
                >
                  פתח
                </a>
              ) : (
                '—'
              ),
            ],
            [
              'לינקדין',
              u.li ? (
                <a
                  key="linkedin"
                  href={u.li}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: BLUE }}
                >
                  פתח
                </a>
              ) : (
                '—'
              ),
            ],
            ['הצטרף', u.createdAt ? new Date(u.createdAt).toLocaleDateString('he-IL') : '—'],
          ].map(([label, val]) => (
            <tr key={label}>
              <td style={{ padding: '6px 0', color: '#888', width: 80, verticalAlign: 'top' }}>
                {label}
              </td>
              <td style={{ padding: '6px 0', color: '#222' }}>{val || '—'}</td>
            </tr>
          ))}
        </table>

        {u.does && (
          <div
            style={{ marginTop: 12, padding: '10px 12px', background: '#f9f9f7', borderRadius: 8 }}
          >
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>מה אני עושה</div>
            <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {u.does}
            </div>
          </div>
        )}
        {u.needs && (
          <div
            style={{ marginTop: 8, padding: '10px 12px', background: '#f9f9f7', borderRadius: 8 }}
          >
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>מה אני מחפש</div>
            <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {u.needs}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: '1.25rem' }}>
          {u.status === 'pending' && (
            <button
              onClick={() => onApprove(u.uid)}
              style={{
                flex: 1,
                padding: 10,
                background: '#EAF3DE',
                color: '#27500A',
                border: '0.5px solid #97C459',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              אשר חבר
            </button>
          )}
          <button
            onClick={() => onDelete(u.uid, u.phone)}
            style={{
              flex: 1,
              padding: 10,
              background: '#FCEBEB',
              color: '#791F1F',
              border: '0.5px solid #F09595',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {u.deleteRequest ? 'מחק (בוקש)' : 'מחק'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin({ user: _user, onLogout, onDashboard }) {
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rulesText, setRulesText] = useState('');
  const [rulesSaved, setRulesSaved] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  async function load() {
    const docs = await db.getDocs('users');
    setUsers(docs.map((d) => ({ uid: d.id, ...d.data() })));
    const rulesSnap = await db.getDoc('settings', 'houseRules');
    if (rulesSnap.exists()) setRulesText(rulesSnap.data().text || '');
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(uid) {
    await db.updateDoc('users', uid, { status: 'active' });
    setUsers((u) => u.map((x) => (x.uid === uid ? { ...x, status: 'active' } : x)));
    setSelected(null);
  }

  async function remove(uid, phone) {
    if (!window.confirm('Delete this user permanently?')) return;
    await db.deleteDoc('users', uid);
    if (phone) await db.deleteDoc('phoneIndex', phone).catch(() => {});
    setUsers((u) => u.filter((x) => x.uid !== uid));
    setSelected(null);
  }

  async function saveRules() {
    setRulesLoading(true);
    await db.setDoc('settings', 'houseRules', {
      text: rulesText,
      updatedAt: new Date().toISOString(),
    });
    setRulesSaved(true);
    setRulesLoading(false);
    setTimeout(() => setRulesSaved(false), 3000);
  }

  const pending = users.filter((u) => u.status === 'pending');
  const deleteRequests = users.filter((u) => u.deleteRequest === true);
  const active = users.filter((u) => u.status === 'active' && u.role !== 'admin');

  let list = tab === 'pending' ? pending : tab === 'delete' ? deleteRequests : active;

  const tabStyle = (t) => ({
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    border: '0.5px solid #ccc',
    background: tab === t ? BLUE : 'transparent',
    color: tab === t ? '#fff' : '#666',
  });

  const thStyle = {
    textAlign: 'right',
    padding: '8px 10px',
    color: '#888',
    fontWeight: 500,
    borderBottom: '0.5px solid #ddd',
    fontSize: 12,
  };
  const tdStyle = {
    padding: '9px 10px',
    borderBottom: '0.5px solid #f0f0f0',
    fontSize: 13,
    verticalAlign: 'middle',
  };

  return (
    <div style={s.wrap}>
      {selected && (
        <UserModal
          user={selected}
          onClose={() => setSelected(null)}
          onApprove={approve}
          onDelete={remove}
        />
      )}

      <Header>
        <button style={s.btnOutline} onClick={onDashboard}>
          דשבורד
        </button>
        <button style={s.btnOutline} onClick={onLogout}>
          התנתקות
        </button>
      </Header>
      <div style={{ ...s.body, maxWidth: 900 }}>
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <div style={{ fontWeight: 500, fontSize: 15 }}>חוקי הבית</div>
            <button
              onClick={saveRules}
              disabled={rulesLoading}
              style={{
                padding: '6px 16px',
                background: BLUE,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                opacity: rulesLoading ? 0.7 : 1,
              }}
            >
              {rulesSaved ? 'נשמר!' : rulesLoading ? 'שומר...' : 'שמור'}
            </button>
          </div>
          <textarea
            style={{ ...s.textarea, minHeight: 120, fontSize: 14, lineHeight: 1.7 }}
            dir="auto"
            placeholder="כתוב כאן את חוקי הבית — יוצגו לכל משתמש בהרשמה ובדשבורד..."
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button style={tabStyle('pending')} onClick={() => setTab('pending')}>
            ממתינים לאישור {pending.length > 0 ? `(${pending.length})` : ''}
          </button>
          <button style={tabStyle('delete')} onClick={() => setTab('delete')}>
            בקשות מחיקה {deleteRequests.length > 0 ? `(${deleteRequests.length})` : ''}
          </button>
          <button style={tabStyle('active')} onClick={() => setTab('active')}>
            חברים פעילים {active.length > 0 ? `(${active.length})` : ''}
          </button>
        </div>

        <div style={{ ...s.card, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>טוען...</div>
          ) : list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>אין רשומות</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>שם</th>
                  <th style={thStyle}>טלפון</th>
                  <th style={thStyle}>עיר</th>
                  <th style={thStyle}>תחום</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.uid} style={{ cursor: 'pointer' }} onClick={() => setSelected(u)}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: avColor(u.phone || u.uid),
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 500,
                            flexShrink: 0,
                          }}
                        >
                          {initials(u)}
                        </div>
                        {u.first} {u.last}
                        {u.deleteRequest && (
                          <span
                            style={{
                              fontSize: 10,
                              background: '#FCEBEB',
                              color: '#A32D2D',
                              borderRadius: 10,
                              padding: '1px 6px',
                            }}
                          >
                            מחיקה
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        direction: 'ltr',
                      }}
                    >
                      {u.phone}
                    </td>
                    <td style={tdStyle}>{u.city || '—'}</td>
                    <td style={tdStyle}>
                      {u.domain ? (
                        <span
                          style={{
                            background: '#E6F1FB',
                            color: '#0C447C',
                            borderRadius: 20,
                            padding: '2px 9px',
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {u.domain}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: '#aaa', fontSize: 18 }}>›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
