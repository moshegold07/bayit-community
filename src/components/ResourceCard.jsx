import { s, BLUE, BLUE_DK, BLUE_LT, safeHref } from './shared';

const CATEGORY_LABELS = {
  article: 'מאמר',
  tool: 'כלי',
  template: 'תבנית',
  video: 'סרטון',
  book: 'ספר',
  course: 'קורס',
  other: 'אחר',
};

const CATEGORY_COLORS = {
  article: { bg: '#E6F1FB', color: '#0F4F8A' },
  tool: { bg: '#E8F5E9', color: '#2E7D32' },
  template: { bg: '#FFF3E0', color: '#E65100' },
  video: { bg: '#F3E5F5', color: '#6A1B9A' },
  book: { bg: '#FFF8E1', color: '#F57F17' },
  course: { bg: '#E0F7FA', color: '#00695C' },
  other: { bg: '#F5F5F5', color: '#616161' },
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ResourceCard({ resource, currentUserId, onUpvote }) {
  const cat = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.other;
  const hasUpvoted = (resource.upvotes || []).includes(currentUserId);

  return (
    <div style={{ ...s.card, marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <a
          href={safeHref(resource.url)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 500, fontSize: 16, color: BLUE_DK, textDecoration: 'none', flex: 1 }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          {resource.title}
        </a>
        <span style={{ ...s.tag, background: cat.bg, color: cat.color, flexShrink: 0 }}>
          {CATEGORY_LABELS[resource.category] || resource.category}
        </span>
      </div>

      {resource.description && (
        <div style={{ fontSize: 13, color: '#666', marginTop: 6, lineHeight: 1.5 }}>
          {resource.description.length > 150
            ? resource.description.slice(0, 150) + '...'
            : resource.description}
        </div>
      )}

      {resource.tags && resource.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {resource.tags.map((tag, i) => (
            <span key={i} style={{ ...s.tag, fontSize: 10, padding: '1px 7px' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '0.5px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => onUpvote(resource.id)}
          style={{
            background: hasUpvoted ? BLUE_LT : 'transparent',
            border: '1px solid ' + (hasUpvoted ? BLUE : '#ddd'),
            borderRadius: 6,
            padding: '3px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: hasUpvoted ? BLUE_DK : '#888',
            fontWeight: hasUpvoted ? 600 : 400,
            fontSize: 13,
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 12 }}>{'\u25B2'}</span>
          {resource.upvoteCount || 0}
        </button>
        <div style={{ fontSize: 11, color: '#aaa', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>
            {'\u05E9\u05D5\u05EA\u05E3 \u05E2"\u05D9'} {resource.sharedByName || '---'}
          </span>
          <span>{formatDate(resource.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
