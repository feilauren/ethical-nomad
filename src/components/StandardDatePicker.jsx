import { useState } from "react";
import { toKey, fmtKey, getDays, getFirst, keyToApiDate, shiftKey } from "../utils/dateUtils";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS     = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/**
 * StandardDatePicker
 *
 * Props:
 *   value    — { dateFrom: "DD/MM/YYYY", dateTo: "DD/MM/YYYY", flexDays: 0|1|2|3 }
 *   onChange — (newValue) => void
 */
export function StandardDatePicker({ value, onChange }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoverKey,  setHoverKey]  = useState(null);

  // Convert API date ("DD/MM/YYYY") back to "YYYY-MM-DD" key for display
  const startKey = value?.dateFrom ? apiToKey(value.dateFrom) : null;
  const endKey   = value?.dateTo   ? apiToKey(value.dateTo)   : null;
  const flexDays = value?.flexDays ?? 0;

  function apiToKey(apiDate) {
    const [d, m, y] = apiDate.split("/");
    return `${y}-${m}-${d}`;
  }

  function handleDayClick(key) {
    if (!startKey || (startKey && endKey)) {
      // Start new range
      onChange({ dateFrom: keyToApiDate(key), dateTo: keyToApiDate(key), flexDays });
    } else {
      // Set end of range
      const [s, e] = key < startKey ? [key, startKey] : [startKey, key];
      onChange({ dateFrom: keyToApiDate(s), dateTo: keyToApiDate(e), flexDays });
    }
  }

  function setFlex(n) {
    onChange({ dateFrom: value?.dateFrom, dateTo: value?.dateTo, flexDays: n });
  }

  // Two-month view
  const months = [
    { year: viewYear, month: viewMonth },
    viewMonth === 11
      ? { year: viewYear + 1, month: 0 }
      : { year: viewYear, month: viewMonth + 1 },
  ];

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div style={s.root}>
      <div style={s.nav}>
        <button onClick={prevMonth} style={s.navBtn}>‹</button>
        <div style={s.calendars}>
          {months.map(({ year, month }) => (
            <MonthCalendar
              key={`${year}-${month}`}
              year={year} month={month}
              todayKey={todayKey}
              startKey={startKey} endKey={endKey} hoverKey={hoverKey}
              onDayClick={handleDayClick}
              onDayHover={setHoverKey}
            />
          ))}
        </div>
        <button onClick={nextMonth} style={s.navBtn}>›</button>
      </div>

      {/* Flexibility row */}
      <div style={s.flexRow}>
        <span style={s.flexLabel}>±Flexibility</span>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => setFlex(n)}
            style={{ ...s.flexBtn, ...(flexDays === n ? s.flexBtnActive : {}) }}
          >
            {n === 0 ? "Exact" : `±${n}d`}
          </button>
        ))}
      </div>

      {/* Summary */}
      {startKey && endKey && (
        <div style={s.summary}>
          {fmtKey(flexDays ? shiftKey(startKey, -flexDays) : startKey)}
          {" → "}
          {fmtKey(flexDays ? shiftKey(endKey, flexDays) : endKey)}
          {flexDays > 0 && <span style={s.flexNote}> (±{flexDays} day{flexDays > 1 ? "s" : ""} flex)</span>}
        </div>
      )}
    </div>
  );
}

function MonthCalendar({ year, month, todayKey, startKey, endKey, hoverKey, onDayClick, onDayHover }) {
  const days  = getDays(year, month);
  const first = getFirst(year, month);

  // Determine effective range for highlight (use hover if end not yet set)
  const rangeEnd = endKey ?? hoverKey;

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div style={s.month}>
      <div style={s.monthName}>{MONTHS[month]} {year}</div>
      <div style={s.dayLabels}>
        {DAY_LABELS.map((l) => <div key={l} style={s.dayLabel}>{l}</div>)}
      </div>
      <div style={s.grid}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const key = toKey(year, month, d);
          const isStart  = key === startKey;
          const isEnd    = key === endKey;
          const isPast   = key < todayKey;
          const inRange  = startKey && rangeEnd && key > Math.min(startKey, rangeEnd) && key < Math.max(startKey, rangeEnd);
          const bg = isStart || isEnd ? "#4f46e5" : inRange ? "#ede9fe" : "transparent";
          const color = isStart || isEnd ? "#fff" : isPast ? "#cbd5e1" : "#0f172a";
          return (
            <button
              key={key}
              disabled={isPast}
              onClick={() => onDayClick(key)}
              onMouseEnter={() => onDayHover(key)}
              onMouseLeave={() => onDayHover(null)}
              style={{
                ...s.dayCell,
                background: bg,
                color,
                borderRadius: isStart || isEnd ? "50%" : inRange ? 0 : "50%",
                cursor: isPast ? "default" : "pointer",
                fontWeight: isStart || isEnd ? 700 : 400,
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  root: { display: "flex", flexDirection: "column", gap: 12 },
  nav: { display: "flex", alignItems: "flex-start", gap: 8 },
  navBtn: {
    background: "none", border: "1px solid #e2e8f0", borderRadius: 6,
    cursor: "pointer", fontSize: 18, padding: "2px 10px", color: "#64748b",
    alignSelf: "center",
  },
  calendars: { display: "flex", gap: 20, flex: 1, justifyContent: "center", flexWrap: "wrap" },
  month: { minWidth: 200 },
  monthName: { fontSize: 13, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 8 },
  dayLabels: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 },
  dayLabel: { fontSize: 10, color: "#94a3b8", textAlign: "center", padding: "2px 0", fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 },
  dayCell: {
    border: "none", width: "100%", aspectRatio: "1", fontSize: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.1s",
  },
  flexRow: { display: "flex", alignItems: "center", gap: 6 },
  flexLabel: { fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" },
  flexBtn: {
    fontSize: 11, padding: "3px 9px", borderRadius: 20,
    border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", color: "#64748b",
  },
  flexBtnActive: { background: "#4f46e5", color: "#fff", border: "1px solid #4f46e5" },
  summary: { fontSize: 12, color: "#4f46e5", fontWeight: 600, textAlign: "center" },
  flexNote: { color: "#94a3b8", fontWeight: 400 },
};
