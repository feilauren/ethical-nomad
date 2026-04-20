import { useState } from "react";
import { toKey, getDays, getFirst, fmtKey, keyToApiDate } from "../utils/dateUtils";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS     = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/**
 * DateTogglePicker — click individual days to toggle them on/off.
 *
 * Props:
 *   selectedDates — string[]  "DD/MM/YYYY" array
 *   onChange      — (newArray) => void
 */
export function DateTogglePicker({ selectedDates = [], onChange }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const todayKey    = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedSet = new Set(selectedDates.map(apiToKey));

  function apiToKey(apiDate) {
    const [d, m, y] = apiDate.split("/");
    return `${y}-${m}-${d}`;
  }

  function toggleDay(key) {
    const apiDate = keyToApiDate(key);
    if (selectedSet.has(key)) {
      onChange(selectedDates.filter((d) => d !== apiDate));
    } else {
      onChange([...selectedDates, apiDate].sort());
    }
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const days  = getDays(year, month);
  const first = getFirst(year, month);

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button onClick={prevMonth} style={s.navBtn}>‹</button>
        <span style={s.monthName}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={s.navBtn}>›</button>
      </div>

      <div style={s.dayLabels}>
        {DAY_LABELS.map((l) => <div key={l} style={s.dayLabel}>{l}</div>)}
      </div>

      <div style={s.grid}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const key     = toKey(year, month, d);
          const isPast  = key < todayKey;
          const active  = selectedSet.has(key);
          return (
            <button
              key={key}
              disabled={isPast}
              onClick={() => toggleDay(key)}
              style={{
                ...s.dayCell,
                background: active ? "#4f46e5" : "transparent",
                color: active ? "#fff" : isPast ? "#cbd5e1" : "#0f172a",
                fontWeight: active ? 700 : 400,
                cursor: isPast ? "default" : "pointer",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {selectedDates.length > 0 && (
        <div style={s.chips}>
          {[...selectedSet].sort().map((k) => (
            <span key={k} style={s.chip}>
              {fmtKey(k)}
              <button onClick={() => toggleDay(k)} style={s.chipX}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  root: { display: "flex", flexDirection: "column", gap: 10 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  navBtn: {
    background: "none", border: "1px solid #e2e8f0", borderRadius: 6,
    cursor: "pointer", fontSize: 18, padding: "2px 10px", color: "#64748b",
  },
  monthName: { fontSize: 13, fontWeight: 700, color: "#0f172a" },
  dayLabels: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 },
  dayLabel: { fontSize: 10, color: "#94a3b8", textAlign: "center", padding: "2px 0", fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 },
  dayCell: {
    border: "none", width: "100%", aspectRatio: "1", fontSize: 12, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.1s",
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 4,
    background: "#ede9fe", color: "#4f46e5", borderRadius: 20,
    fontSize: 11, padding: "2px 8px", fontWeight: 500,
  },
  chipX: {
    background: "none", border: "none", cursor: "pointer",
    color: "inherit", padding: 0, fontSize: 13, lineHeight: 1, opacity: 0.7,
  },
};
