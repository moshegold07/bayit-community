import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, DEV_PURPLE, BLUE, CREAM } from '../components/shared';

const TYPES = [
  { value: 'bug', label: 'באג' },
  { value: 'feature', label: "בקשת פיצ'ר" },
];

const PRIORITIES = [
  { value: 'low', label: 'נמוכה', color: '#6BBF6A' },
  { value: 'medium', label: 'בינונית', color: '#E8A838' },
  { value: 'high', label: 'גבוהה', color: '#E87438' },
  { value: 'urgent', label: 'דחוף', color: '#D94040' },
];

const STATUSES = [
  { value: 'open', label: 'פתוח', color: '#3B7DD8' },
  { value: 'in_progress', label: 'בטיפול', color: '#E8A838' },
  { value: 'closed', label: 'סגור', color: '#888' },
];

function priorityInfo(val) {
  return PRIORITIES.find((p) => p.value === val) || PRIORITIES[0];
}
function statusInfo(val) {
  return STATUSES.find((st) => st.value === val) || STATUSES[0];
}

export default function DevTickets() {
  const { user, isPending } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'bug', priority: 'medium', title: '', description: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const snap = await db.getDocs('tickets', [], { field: 'createdAt', direction: 'DESCENDING' });
      setTickets(snap.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setTickets([]);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await db.addDoc('tickets', {
        type: form.type,
        priority: form.priority,
        title: form.title.trim(),
        description: form.description.trim(),
        status: 'open',
        createdBy: user.uid,
        createdByName: (user.first || '') + ' ' + (user.last || ''),
        createdAt: new Date().toISOString(),
      });
      setForm({ type: 'bug', priority: 'medium', title: '', description: '' });
      setShowForm(false);
      await loadTickets();
    } catch {
      /* ignore */
    }
    setSaving(false);
  }

  async function toggleStatus(ticket) {
    if (user?.role !== 'admin') return;
    const next =
      ticket.status === 'open'
        ? 'in_progress'
        : ticket.status === 'in_progress'
          ? 'closed'
          : 'open';
    await db.updateDoc('tickets', ticket.id, { status: next });
    await loadTickets();
  }

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  const headerStyle = {
    background: `linear-gradient(135deg, ${DEV_PURPLE} 0%, #5E3FA3 100%)`,
    color: '#fff',
    padding: '1.25rem 1.5rem',
    borderRadius: 12,
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  };

  const chipStyle = (active) => ({
    padding: '5px 14px',
    borderRadius: 20,
    fontSize: 13,
    cursor: 'pointer',
    border: active ? `2px solid ${DEV_PURPLE}` : '1px solid #ccc',
    background: active ? '#F0EAFF' : '#fff',
    color: active ? DEV_PURPLE : '#666',
    fontWeight: active ? 600 : 400,
  });

  return (
    <div style={s.wrap}>
      <div style={{ ...s.body, maxWidth: 720 }}>
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>פיתוח</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>
              דיווח באגים ובקשות פיצ&apos;רים
            </div>
          </div>
          {!isPending && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '8px 20px',
                background: '#fff',
                color: DEV_PURPLE,
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showForm ? 'ביטול' : '+ טיקט חדש'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ ...s.card, marginBottom: 16 }}>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}
            >
              <div>
                <label style={s.label}>סוג</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={{ ...s.input, cursor: 'pointer' }}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={s.label}>עדיפות</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  style={{ ...s.input, cursor: 'pointer' }}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>כותרת</label>
              <input
                style={s.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="תאר בקצרה את הבעיה או הבקשה..."
                required
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>פירוט</label>
              <textarea
                style={{ ...s.textarea, minHeight: 100 }}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="הוסף פרטים, צעדים לשחזור, או תיאור מפורט..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...s.btnPrimary,
                background: `linear-gradient(135deg, ${DEV_PURPLE} 0%, #5E3FA3 100%)`,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'שולח...' : 'שלח טיקט'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')} style={chipStyle(filter === 'all')}>
            הכל ({tickets.length})
          </button>
          {STATUSES.map((st) => {
            const count = tickets.filter((t) => t.status === st.value).length;
            return (
              <button
                key={st.value}
                onClick={() => setFilter(st.value)}
                style={chipStyle(filter === st.value)}
              >
                {st.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>טוען...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>
            אין טיקטים{filter !== 'all' ? ' בקטגוריה זו' : ''}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((ticket) => {
              const pri = priorityInfo(ticket.priority);
              const stat = statusInfo(ticket.status);
              return (
                <div
                  key={ticket.id}
                  style={{
                    ...s.card,
                    borderRight: `4px solid ${pri.color}`,
                    opacity: ticket.status === 'closed' ? 0.65 : 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          marginBottom: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 10px',
                            borderRadius: 20,
                            background: ticket.type === 'bug' ? '#FDEAEA' : '#EAF0FD',
                            color: ticket.type === 'bug' ? '#C0392B' : '#2E5AAC',
                            fontWeight: 600,
                          }}
                        >
                          {ticket.type === 'bug' ? 'באג' : "פיצ'ר"}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 10px',
                            borderRadius: 20,
                            background: `${pri.color}18`,
                            color: pri.color,
                            fontWeight: 500,
                          }}
                        >
                          {pri.label}
                        </span>
                        <span
                          onClick={() => toggleStatus(ticket)}
                          style={{
                            fontSize: 11,
                            padding: '2px 10px',
                            borderRadius: 20,
                            background: `${stat.color}18`,
                            color: stat.color,
                            fontWeight: 500,
                            cursor: user?.role === 'admin' ? 'pointer' : 'default',
                          }}
                          title={user?.role === 'admin' ? 'לחץ לשנות סטטוס' : ''}
                        >
                          {stat.label}
                        </span>
                      </div>
                      <div
                        style={{ fontSize: 15, fontWeight: 600, color: '#1C2638', marginBottom: 4 }}
                      >
                        {ticket.title}
                      </div>
                      {ticket.description && (
                        <div
                          style={{
                            fontSize: 13,
                            color: '#555',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {ticket.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 10,
                      fontSize: 11,
                      color: '#999',
                    }}
                  >
                    <span>{ticket.createdByName}</span>
                    <span>
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleDateString('he-IL')
                        : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
