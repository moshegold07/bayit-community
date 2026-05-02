import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

const DAY_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const TYPE_COLORS = {
  meetup: '#3B7DD8',
  workshop: '#2E7D32',
  social: '#E65100',
  online: '#6A1B9A',
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function buildCalendarCells(year, month) {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const cells = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ day, dateStr, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr, isCurrentMonth: true });
  }

  // Next month leading days to complete last row
  const remaining = cells.length % 7;
  if (remaining > 0) {
    const needed = 7 - remaining;
    const nextM = month === 11 ? 0 : month + 1;
    const nextY = month === 11 ? year + 1 : year;
    for (let d = 1; d <= needed; d++) {
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr, isCurrentMonth: false });
    }
  }

  return cells;
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export default function CalendarView({ events = [] }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [isSmall, setIsSmall] = useState(window.innerWidth < 600);

  // Track window resize for responsive
  useEffect(() => {
    function onResize() {
      setIsSmall(window.innerWidth < 600);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Group events by date
  const eventsByDate = {};
  events.forEach((ev) => {
    if (!ev.date) return;
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  const cells = buildCalendarCells(currentYear, currentMonth);

  function goToPrev() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNext() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    direction: 'rtl',
  };

  const navBtnStyle = {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 18,
    cursor: 'pointer',
    color: '#444',
    lineHeight: 1,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 1,
    background: '#eee',
    border: '1px solid #ddd',
    borderRadius: 8,
    overflow: 'hidden',
  };

  const headerCellStyle = {
    background: '#f7f7f7',
    textAlign: 'center',
    padding: '8px 4px',
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* Navigation */}
      <div style={navStyle}>
        <button onClick={goToNext} style={navBtnStyle} aria-label="חודש הבא">
          &#8594;
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#222' }}>
          {HEBREW_MONTHS[currentMonth]} {currentYear}
        </div>
        <button onClick={goToPrev} style={navBtnStyle} aria-label="חודש קודם">
          &#8592;
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={gridStyle}>
        {/* Day headers */}
        {DAY_HEADERS.map((d) => (
          <div key={d} style={headerCellStyle}>
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const dayEvents = eventsByDate[cell.dateStr] || [];
          const showEvents = dayEvents.slice(0, 2);
          const extraCount = dayEvents.length - 2;

          return (
            <div
              key={idx}
              style={{
                background: isToday ? '#E8F6F6' : '#fff',
                padding: isSmall ? '4px 2px' : '6px 4px',
                minHeight: isSmall ? 48 : 72,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Day number */}
              <div
                style={{
                  fontSize: isSmall ? 11 : 13,
                  fontWeight: isToday ? 700 : 400,
                  color: cell.isCurrentMonth ? (isToday ? '#0D9488' : '#222') : '#ccc',
                  marginBottom: 2,
                  textAlign: 'center',
                }}
              >
                {cell.day}
              </div>

              {/* Event indicators */}
              <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {isSmall ? (
                  /* Small screen: colored dots only */
                  dayEvents.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        marginTop: 2,
                      }}
                    >
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <Link
                          key={ev.id || i}
                          to={`/events/${ev.id}`}
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: TYPE_COLORS[ev.type] || '#888',
                            display: 'block',
                          }}
                          title={ev.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: 8, color: '#888' }}>+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )
                ) : (
                  /* Larger screen: text pills */
                  <>
                    {showEvents.map((ev, i) => (
                      <Link
                        key={ev.id || i}
                        to={`/events/${ev.id}`}
                        style={{
                          display: 'block',
                          fontSize: 10,
                          lineHeight: '16px',
                          padding: '0 4px',
                          borderRadius: 3,
                          background: TYPE_COLORS[ev.type] || '#888',
                          color: '#fff',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={ev.title}
                      >
                        {truncate(ev.title, 15)}
                      </Link>
                    ))}
                    {extraCount > 0 && (
                      <div style={{ fontSize: 9, color: '#888', textAlign: 'center' }}>
                        +{extraCount}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
