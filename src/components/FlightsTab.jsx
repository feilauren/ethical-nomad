import { useState, useRef, useCallback } from "react";
import { AirportSelector, buildFlyFrom } from "./AirportSelector";
import { StandardDatePicker } from "./StandardDatePicker";
import { DateTogglePicker } from "./DateTogglePicker";
import { useTravelAnywhere } from "../hooks/useTravelAnywhere";
import { countries, CONTINENTS } from "../data/countries";
import { keyToApiDate, shiftKey } from "../utils/dateUtils";

const CURRENCIES = ["EUR", "USD", "GBP", "CAD", "AUD", "CHF", "JPY", "SEK", "NOK", "DKK"];
const SAVED_KEY  = "en-saved-searches";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) ?? []; } catch { return []; }
}
function persistSaved(list) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch {}
}

// Default date range: depart in ~30 days, return 7 days later
function defaultRange() {
  const from = new Date();
  from.setDate(from.getDate() + 30);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  const fmt = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
  };
  return { dateFrom: fmt(from), dateTo: fmt(to), flexDays: 0 };
}

export function FlightsTab({ lists, listsApi }) {
  const [airport,      setAirport]      = useState({ homeKey: "Düsseldorf (DUS)", enabled: new Set(["DUS"]) });
  const [destMode,     setDestMode]     = useState("list"); // "list" | "manual"
  const [activeListId, setActiveListId] = useState(lists[0]?.id ?? null);
  const [manualSel,    setManualSel]    = useState(new Set());
  const [dateMode,     setDateMode]     = useState("range"); // "range" | "specific"
  const [rangeValue,   setRangeValue]   = useState(defaultRange());
  const [specificDates,setSpecificDates]= useState([]);
  const [curr,         setCurr]         = useState("EUR");
  const [callCount,    setCallCount]    = useState(0);
  const [sortBy,       setSortBy]       = useState("price");
  const [savedSearches,setSavedSearches]= useState(loadSaved);

  const { search, results, anyLoading, clear } = useTravelAnywhere();

  // ── Derived ──────────────────────────────────────────────────────────────────
  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0];
  const destCountries = destMode === "list"
    ? (activeList?.countries ?? [])
    : [...manualSel];

  // ── Search ───────────────────────────────────────────────────────────────────
  function handleSearch() {
    if (!destCountries.length) return;
    const flyFrom = buildFlyFrom(airport);
    if (!flyFrom) return;

    let dateFrom, dateTo;
    if (dateMode === "range") {
      const { dateFrom: df, dateTo: dt, flexDays } = rangeValue;
      if (!df || !dt) return;
      // Apply flexibility by widening the window
      dateFrom = flexDays ? shiftKey(apiToYMD(df), -flexDays).replace(/-/g, "/").split("/").reverse().join("/")
                          : df;
      dateTo   = flexDays ? shiftKey(apiToYMD(dt), flexDays).replace(/-/g, "/").split("/").reverse().join("/")
                          : dt;
      // Actually shiftKey returns YYYY-MM-DD; need keyToApiDate
      if (flexDays) {
        dateFrom = keyToApiDate(shiftKey(apiToYMD(df), -flexDays));
        dateTo   = keyToApiDate(shiftKey(apiToYMD(dt),  flexDays));
      }
    } else {
      if (!specificDates.length) return;
      const sorted = [...specificDates].sort();
      dateFrom = sorted[0];
      dateTo   = sorted[sorted.length - 1];
    }

    setCallCount((n) => n + destCountries.length);
    search({ flyFrom, dateFrom, dateTo, curr, countries: destCountries });
  }

  function apiToYMD(apiDate) {
    const [d, m, y] = apiDate.split("/");
    return `${y}-${m}-${d}`;
  }

  // ── Saved searches ────────────────────────────────────────────────────────────
  function saveCurrentSearch() {
    const flyFrom = buildFlyFrom(airport);
    const label   = `${flyFrom} → ${destCountries.slice(0, 3).join(", ")}${destCountries.length > 3 ? "…" : ""}`;
    const entry   = {
      id: crypto.randomUUID(),
      label,
      airport,
      destMode,
      activeListId,
      manualSel: [...manualSel],
      dateMode,
      rangeValue,
      specificDates,
      curr,
    };
    const next = [entry, ...savedSearches].slice(0, 8);
    setSavedSearches(next);
    persistSaved(next);
  }

  function runSaved(entry) {
    setAirport(entry.airport);
    setDestMode(entry.destMode);
    setActiveListId(entry.activeListId);
    setManualSel(new Set(entry.manualSel));
    setDateMode(entry.dateMode);
    setRangeValue(entry.rangeValue);
    setSpecificDates(entry.specificDates);
    setCurr(entry.curr);
    clear();
  }

  function deleteSaved(id) {
    const next = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(next);
    persistSaved(next);
  }

  // ── Sort results ──────────────────────────────────────────────────────────────
  const sorted = [...results].sort((a, b) => {
    if (sortBy === "price") return (a.flight?.price ?? Infinity) - (b.flight?.price ?? Infinity);
    return durationMins(a.flight?.duration) - durationMins(b.flight?.duration);
  });

  // ── Manual country toggle ─────────────────────────────────────────────────────
  function toggleManual(name) {
    setManualSel((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  // ── Create new list from FlightsTab ──────────────────────────────────────────
  function handleCreateList() {
    const name = prompt("New list name:");
    if (name?.trim()) listsApi.createList(name.trim());
  }

  return (
    <div style={s.root}>
      {/* ── Controls card ── */}
      <div style={s.controls}>

        {/* Saved searches */}
        {savedSearches.length > 0 && (
          <div style={s.savedRow}>
            <span style={s.savedLabel}>Saved:</span>
            {savedSearches.map((sv) => (
              <span key={sv.id} style={s.savedChip}>
                <button onClick={() => runSaved(sv)} style={s.savedChipBtn}>{sv.label}</button>
                <button onClick={() => deleteSaved(sv.id)} style={s.savedChipX}>×</button>
              </span>
            ))}
          </div>
        )}

        {/* Origin */}
        <ControlSection label="From">
          <AirportSelector value={airport} onChange={setAirport} />
        </ControlSection>

        {/* Destination */}
        <ControlSection label="To">
          <div style={s.modeToggle}>
            <ModeBtn active={destMode === "list"} onClick={() => setDestMode("list")}>Trip list</ModeBtn>
            <ModeBtn active={destMode === "manual"} onClick={() => setDestMode("manual")}>Select countries</ModeBtn>
          </div>

          {destMode === "list" ? (
            <div style={s.listSelector}>
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setActiveListId(l.id); clear(); }}
                  style={{ ...s.listPill, ...(l.id === activeListId ? s.listPillActive : {}) }}
                >
                  {l.name}
                  <span style={s.listCount}>{l.countries.length}</span>
                </button>
              ))}
              <button onClick={handleCreateList} style={s.newListBtn}>+ New</button>
            </div>
          ) : (
            <ManualCountrySelector selected={manualSel} onToggle={toggleManual} />
          )}

          {destCountries.length > 0 && (
            <p style={s.destCount}>{destCountries.length} destination{destCountries.length !== 1 ? "s" : ""} selected</p>
          )}
        </ControlSection>

        {/* Dates */}
        <ControlSection label="When">
          <div style={s.modeToggle}>
            <ModeBtn active={dateMode === "range"} onClick={() => setDateMode("range")}>Date range</ModeBtn>
            <ModeBtn active={dateMode === "specific"} onClick={() => setDateMode("specific")}>Specific dates</ModeBtn>
          </div>

          {dateMode === "range" ? (
            <StandardDatePicker value={rangeValue} onChange={setRangeValue} />
          ) : (
            <DateTogglePicker selectedDates={specificDates} onChange={setSpecificDates} />
          )}
        </ControlSection>

        {/* Currency + Search row */}
        <div style={s.bottomRow}>
          <div style={s.currField}>
            <label style={s.currLabel}>Currency</label>
            <select value={curr} onChange={(e) => setCurr(e.target.value)} style={s.currSelect}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={!destCountries.length || anyLoading}
            style={{ ...s.searchBtn, ...(!destCountries.length || anyLoading ? s.searchBtnDisabled : {}) }}
          >
            {anyLoading
              ? `Searching ${results.filter((r) => r.loading).length} left…`
              : `Search ${destCountries.length || "—"} destinations`}
          </button>

          {results.length > 0 && !anyLoading && (
            <button onClick={saveCurrentSearch} style={s.saveBtn}>Save search</button>
          )}
        </div>

        <div style={s.callCounter}>
          {callCount} API call{callCount !== 1 ? "s" : ""} used this session
        </div>
      </div>

      {/* ── Results ── */}
      {sorted.length > 0 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Destination</th>
                <SortTh label="Price"    col="price"    sortBy={sortBy} onSort={setSortBy} />
                <SortTh label="Duration" col="duration" sortBy={sortBy} onSort={setSortBy} />
                <th style={s.th}>Stops</th>
                <th style={s.th}>Airline</th>
                <th style={s.th}>Date</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => <ResultRow key={row.country} row={row} curr={curr} />)}
            </tbody>
          </table>
          <p style={s.disclaimer}>Prices from Skyscanner. Click Book to confirm on Skyscanner.</p>
        </div>
      )}

      {sorted.length === 0 && !anyLoading && results.length === 0 && destCountries.length === 0 && (
        <p style={s.hint}>Add countries to a trip list in Explore, then search here.</p>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ControlSection({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{label}</div>
      {children}
    </div>
  );
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", borderRadius: 20, border: "none",
      background: active ? "#4f46e5" : "#f1f5f9",
      color: active ? "#fff" : "#64748b",
      fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer",
    }}>{children}</button>
  );
}

function ManualCountrySelector({ selected, onToggle }) {
  const byCont = CONTINENTS.filter((c) => c !== "All").map((cont) => ({
    cont,
    list: countries.filter((c) => c.continent === cont),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" }}>
      {byCont.map(({ cont, list }) => (
        <div key={cont}>
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>{cont}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {list.map((c) => {
              const on = selected.has(c.name);
              return (
                <button key={c.name} onClick={() => onToggle(c.name)} style={{
                  padding: "3px 10px", borderRadius: 20, border: "1px solid",
                  borderColor: on ? "#4f46e5" : "#e2e8f0",
                  background: on ? "#ede9fe" : "#fff",
                  color: on ? "#4f46e5" : "#64748b",
                  fontSize: 11, cursor: "pointer",
                }}>
                  {c.flag} {c.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function SortTh({ label, col, sortBy, onSort }) {
  const active = sortBy === col;
  return (
    <th onClick={() => onSort(col)} style={{ ...s.th, cursor: "pointer", userSelect: "none", color: active ? "#4f46e5" : "#64748b" }}>
      {label} {active ? "↑" : "↕"}
    </th>
  );
}

function ResultRow({ row, curr }) {
  if (row.loading) {
    return (
      <tr style={s.tr}>
        <td style={s.td}><span style={s.flag}>{row.flag}</span> {row.country}</td>
        <td style={{ ...s.td, ...s.skeleton }} colSpan={6} />
      </tr>
    );
  }
  if (!row.flight || row.error) {
    return (
      <tr style={{ ...s.tr, opacity: 0.5 }}>
        <td style={s.td}><span style={s.flag}>{row.flag}</span> {row.country}</td>
        <td style={s.td} colSpan={6}><span style={{ fontSize: 12, color: "#94a3b8" }}>No flights found</span></td>
      </tr>
    );
  }
  const f = row.flight;
  return (
    <tr style={s.tr}>
      <td style={s.td}><span style={s.flag}>{row.flag}</span> {row.country}</td>
      <td style={{ ...s.td, fontWeight: 700 }}>{f.price != null ? `${f.price} ${curr}` : "—"}</td>
      <td style={s.td}>{formatDur(f.duration)}</td>
      <td style={s.td}>{f.stops != null ? (f.stops === 0 ? "Direct" : `${f.stops}×`) : "—"}</td>
      <td style={s.td}>{f.airline ?? "—"}</td>
      <td style={s.td}>{f.departDate ?? "—"}</td>
      <td style={s.td}>
        {f.deepLink ? <a href={f.deepLink} target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", fontWeight: 600, fontSize: 12 }}>Book →</a> : "—"}
      </td>
    </tr>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function durationMins(d) {
  if (d == null) return Infinity;
  if (typeof d === "number") return Math.round(d / 60);
  const h = (d.match(/(\d+)\s*h/) || [])[1] ?? 0;
  const m = (d.match(/(\d+)\s*m/) || [])[1] ?? 0;
  return +h * 60 + +m;
}

function formatDur(d) {
  if (d == null) return "—";
  if (typeof d === "number") {
    const h = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60);
    return `${h}h ${m}m`;
  }
  return d;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  controls: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  savedRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  savedLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" },
  savedChip: { display: "inline-flex", alignItems: "center", background: "#ede9fe", borderRadius: 20, overflow: "hidden" },
  savedChipBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#4f46e5", padding: "3px 8px", fontWeight: 500 },
  savedChipX: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#a5b4fc", padding: "3px 6px" },
  modeToggle: { display: "flex", gap: 6 },
  listSelector: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" },
  listPill: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
    background: "#f8fafc", cursor: "pointer", fontSize: 12, color: "#475569",
  },
  listPillActive: { background: "#ede9fe", border: "1px solid #c4b5fd", color: "#4f46e5" },
  listCount: { fontSize: 10, background: "#e2e8f0", borderRadius: 10, padding: "1px 5px" },
  newListBtn: {
    padding: "5px 10px", borderRadius: 8, border: "1px dashed #cbd5e1",
    background: "none", color: "#64748b", fontSize: 11, cursor: "pointer",
  },
  destCount: { fontSize: 11, color: "#94a3b8", margin: 0 },
  bottomRow: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  currField: { display: "flex", flexDirection: "column", gap: 4 },
  currLabel: { fontSize: 11, color: "#94a3b8" },
  currSelect: { fontSize: 13, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" },
  searchBtn: {
    padding: "10px 20px", borderRadius: 8, border: "none",
    background: "#4f46e5", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
  },
  searchBtnDisabled: { background: "#94a3b8", cursor: "not-allowed" },
  saveBtn: {
    padding: "8px 14px", borderRadius: 8, border: "1px solid #c4b5fd",
    background: "#f5f3ff", color: "#4f46e5", fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  callCounter: { fontSize: 11, color: "#94a3b8", textAlign: "right" },

  // Table
  tableWrap: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "10px 14px", verticalAlign: "middle" },
  flag: { marginRight: 6 },
  skeleton: {
    background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
    backgroundSize: "200% 100%",
    height: 14, borderRadius: 4,
  },
  disclaimer: { fontSize: 11, color: "#94a3b8", padding: "8px 14px", borderTop: "1px solid #f1f5f9", margin: 0 },
  hint: { color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "40px 0" },
};
