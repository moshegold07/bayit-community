import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE, BLUE_LT, BLUE_DK, NAVY, GOLD, safeHref } from '../components/shared';
import UserLink from '../components/UserLink';
import { categoryFullLabel } from '../utils/categories';

export default function VentureDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [venture, setVenture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await db.getDoc('ventures', id);
        if (!cancelled) {
          if (snap.exists()) setVenture({ id, ...snap.data() });
          else setVenture(null);
        }
      } catch {
        if (!cancelled) setVenture(null);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function setStatus(next) {
    if (!venture) return;
    setUpdating(true);
    try {
      await db.updateDoc('ventures', id, {
        status: next,
        distributedAt: next === 'distributed' ? new Date().toISOString() : null,
      });
      setVenture((v) => ({
        ...v,
        status: next,
        distributedAt: next === 'distributed' ? new Date().toISOString() : null,
      }));
    } catch {
      // silent
    }
    setUpdating(false);
  }

  if (loading) {
    return (
      <div style={{ ...s.body, textAlign: 'center', color: '#888' }}>טוען...</div>
    );
  }
  if (!venture) {
    return (
      <div style={{ ...s.body, textAlign: 'center', color: '#888' }}>המיזם לא נמצא.</div>
    );
  }

  const dateStr = venture.createdAt
    ? new Date(venture.createdAt).toLocaleDateString('he-IL')
    : '—';

  return (
    <div style={{ ...s.body, maxWidth: 720 }}>
      <button
        onClick={() => navigate('/ventures')}
        style={{
          background: 'none',
          border: 'none',
          color: BLUE,
          cursor: 'pointer',
          fontSize: 14,
          padding: 0,
          marginBottom: '1rem',
        }}
      >
        → חזרה למיזמים
      </button>

      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span
            style={{
              background: NAVY,
              color: GOLD,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 14,
              padding: '4px 14px',
              fontFamily: 'monospace',
              direction: 'ltr',
            }}
            title="מספר בתור הפצה"
          >
            #{venture.queueNumber ?? '—'}
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: NAVY, flex: 1 }}>
            {venture.title}
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            paddingBottom: 12,
            marginBottom: 12,
            borderBottom: '0.5px solid #eee',
            fontSize: 12,
            color: '#888',
          }}
        >
          {venture.category && (
            <span
              style={{
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 20,
                background: BLUE_LT,
                color: BLUE_DK,
                fontWeight: 500,
              }}
            >
              {categoryFullLabel(venture.category)}
            </span>
          )}
          <span>פורסם ב-{dateStr}</span>
          <UserLink uid={venture.createdBy} style={{ fontSize: 12, color: '#666' }}>
            {'ע"י '}
            {venture.createdByName || 'חבר'}
          </UserLink>
          {venture.status === 'distributed' && (
            <span
              style={{
                fontSize: 11,
                background: '#EAF3DE',
                color: '#27500A',
                borderRadius: 10,
                padding: '2px 8px',
                fontWeight: 500,
              }}
            >
              הופץ
              {venture.distributedAt
                ? ' · ' + new Date(venture.distributedAt).toLocaleDateString('he-IL')
                : ''}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: '#222',
            whiteSpace: 'pre-wrap',
            marginBottom: 16,
          }}
        >
          {venture.story}
        </div>

        {venture.link && (
          <a
            href={safeHref(venture.link)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '8px 18px',
              background: BLUE,
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            לאתר המיזם ↗
          </a>
        )}

        {isAdmin && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '0.5px solid #eee',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, color: '#888', alignSelf: 'center' }}>ניהול:</span>
            {venture.status !== 'distributed' && (
              <button
                onClick={() => setStatus('distributed')}
                disabled={updating}
                style={{
                  padding: '6px 14px',
                  background: '#EAF3DE',
                  color: '#27500A',
                  border: '0.5px solid #97C459',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  opacity: updating ? 0.6 : 1,
                }}
              >
                סמן כהופץ
              </button>
            )}
            {venture.status === 'distributed' && (
              <button
                onClick={() => setStatus('pending')}
                disabled={updating}
                style={{
                  padding: '6px 14px',
                  background: '#FFF8EB',
                  color: '#8B6700',
                  border: '0.5px solid #E8A838',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  opacity: updating ? 0.6 : 1,
                }}
              >
                החזר לממתין
              </button>
            )}
            {venture.status !== 'archived' && (
              <button
                onClick={() => setStatus('archived')}
                disabled={updating}
                style={{
                  padding: '6px 14px',
                  background: '#fff',
                  color: '#666',
                  border: '0.5px solid #ccc',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  opacity: updating ? 0.6 : 1,
                }}
              >
                ארכוב
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
