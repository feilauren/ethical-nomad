import { useState, useCallback } from "react";
import { AirportSelector, buildFlyFrom } from "./AirportSelector";
import { useTravelAnywhere } from "../hooks/useTravelAnywhere";

const DEFAULT_AIRPORT = { homeKey: "Düsseldorf (DUS)", enabled: new Set(["DUS"]) };

// ── Date helpers ──────────────────────────────────────────────────────────────

function toInputDate(d) {
  // JS Date → "YYYY-MM-DD"
  return d.toISOString().slice(0, 10);
}

function toApiDate(s) {
  // "YYYY-MM-DD" → "DD/MM/YYYY"
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function defaultDates() {
  const from = new Date();
  from.setDate(from.getDate() + 30);
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  return { from: toInputDate(from), to: toInputDate(to) };
}

// ── Currency list ─────────────────────────────────────────────────────────────

const CURRENCIES = ["EUR", "USD", "GBP", "CAD", "AUD", "CHF", "JPY", "SEK", "NOK", "DKK"];

// ── TravelAnywhere ────────────────────────────────────────────────────────────

export function TravelAnywhere({ lists, onCreateList, onBack }) {
  const [activeListId, setActiveListId] = useState(lists[0]?.id ?? null);
  const [airport, setAirport]           = useState(DEFAULT_AIRPORT);
  const [curr, setCurr]                 = useState("EUR");
  const [sortBy, setSortBy]             = useState("price"); // "price" | "duration"
  const [newListName, setNewListName]   = useState("");
  const [showNewList, setShowNewList]   = useState(false);
  const { from: defaultFrom, to: defaultTo } = defaultDates();
  const [dateFrom, setDateFrom]         = useState(defaultFrom);
  const [dateTo, setDateTo]             = useState(defaultTo);

  const { search, results, anyLoading, clear } = useTravelAnywhere();

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0];

  function handleSearch() {
    if (!activeList || activeList.countries.length === 0) return;
    const flyFrom = buildFlyFrom(airport);
    if (!flyFrom) return;
    search({
      flyFrom,
      dateFrom: toApiDate(dateFrom),
      dateTo:   toApiDate(dateTo),
      curr,
      countries: activeList.countries,
    });
  }

  function handleCreateList(e) {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    onCreateList(name);
    setNewListName("");
    setShowNewList(false);
    // Switch to the new list — it will be the last one
    // Parent will re-render with updated lists; we rely on effect to pick it up
  }

  // Sort results
  const sorted = [...results].sort((a, b) => {
    if (sortBy === "price") {
      const pa = a.flight?.price ?? Infinity;
      const pb = b.flight?.price ?? Infinity;
      return pa - pb;
    } else {
      const da = durationMinutes(a.flight?.duration);
      const db = durationMinutes(b.flight?.duration);
      return da - db;
    }
  });

  return (
    <div style={s.root}>
      {/* ── Header bar ── */}
      <div style={s.topBar}>
        <button onClick={onBack} style={s.backBtn}>← Browse</button>
        <h2 style={s.title}>Travel Anywhere</h2>
      </div>

      <div style={s.body}>
        {/* ── Left panel: list selector ── */}
        <aside style={s.sidebar}>
          <div style={s.sidebarHeading}>Your lists</div>

          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => { setActiveListId(list.id); clear(); }}
              style={{ ...s.listPill, ...(list.id === activeListId ? s.listPillActive : {}) }}
            >
              <span style={s.listPillName}>{list.name}</span>
              <span style={s.listPillCount}>{list.countries.length}</span>
            </button>
          ))}

          {showNewList ? (
            <form onSubmit={handleCreateList} style={s.newListForm}>
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name…"
                style={s.newListInput}
              />
              <button type="submit" style={s.newListSave}>Add</button>
              <button type="button" onClick={() => setShowNewList(false)} style={s.newListCancel}>✕</button>
            </form>
          ) : (
            <button onClick={() => setShowNewList(true)} style={s.newListBtn}>+ New list</button>
          )}

          {activeList && activeList.countries.length > 0 && (
            <div style={s.countryList}>
              <div style={s.countryListHeading}>Countries ({activeList.countries.length})</div>
              {activeList.countries.map((c) => (
                <div key={c} style={s.countryItem}>{c}</div>
              ))}
            </div>
          )}

          {activeList && activeList.countries.length === 0 && (
            <p style={s.emptyHint}>Bookmark countries while browsing to add them here.</p>
          )}
        </aside>

        {/* ── Right panel: search + results ── */}
        <div style={s.main}>
          {/* Search controls */}
          <div style={s.searchCard}>
            <AirportSelector value={airport} onChange={setAirport} />

            <div style={s.dateRow}>
              <div style={s.dateField}>
                <label style={s.dateLabel}>Depart from</label>
                <input
                  type="date"
                  value={dateFrom}
                  min={toInputDate(new Date())}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={s.dateInput}
                />
              </div>
              <div style={s.dateField}>
                <label style={s.dateLabel}>Return by</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={s.dateInput}
                />
              </div>
              <div style={s.dateField}>
                <label style={s.dateLabel}>Currency</label>
                <select value={curr} onChange={(e) => setCurr(e.target.value)} style={s.currSelect}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={!activeList || activeList.countries.length === 0 || anyLoading}
              style={{
                ...s.searchBtn,
                ...(!activeList || activeList.countries.length === 0 || anyLoading ? s.searchBtnDisabled : {}),
              }}
            >
              {anyLoading
                ? `Searching ${results.filter((r) => r.loading).length} destinations…`
                : `Search ${activeList?.countries.length ?? 0} destinations`}
            </button>
          </div>

          {/* Results table */}
          {sorted.length > 0 && (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Destination</th>
                    <SortHeader label="Price" col="price" sortBy={sortBy} onSort={setSortBy} />
                    <SortHeader label="Duration" col="duration" sortBy={sortBy} onSort={setSortBy} />
                    <th style={s.th}>Stops</th>
                    <th style={s.th}>Airline</th>
                    <th style={s.th}>Date</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <ResultRow key={row.country} row={row} curr={curr} />
                  ))}
                </tbody>
              </table>
              <p style={s.disclaimer}>Prices from Skyscanner. Click Book to verify on Skyscanner.</p>
            </div>
          )}

          {sorted.length === 0 && !anyLoading && results.length === 0 && (
            <p style={s.noResults}>
              {activeList && activeList.countries.length > 0
                ? "Set your dates and hit Search."
                : "Add countries to your list by clicking ☆ on any country card."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SortHeader({ label, col, sortBy, onSort }) {
  const active = sortBy === col;
  return (
    <th
      style={{ ...s.th, ...s.thSortable, ...(active ? s.thActive : {}) }}
      onClick={() => onSort(col)}
    >
      {label} {active ? "↑" : "↕"}
    </th>
  );
}

function ResultRow({ row, curr }) {
  if (row.loading) {
    return (
      <tr style={s.tr}>
        <td style={s.td}><span style={s.flag}>{row.flag}</span> {row.country}</td>
        <td style={{ ...s.td, ...s.skeleton }} colSpan={6}></td>
      </tr>
    );
  }

  if (!row.flight || row.error) {
    return (
      <tr style={{ ...s.tr, ...s.trMuted }}>
        <td style={s.td}><span style={s.flag}>{row.flag}</span> {row.country}</td>
        <td style={s.td} colSpan={6}>
          <span style={s.noFlight}>No flights found</span>
        </td>
      </tr>
    );
  }

  const f = row.flight;
  return (
    <tr style={s.tr}>
      <td style={s.td}><span style={s.flag}>{row.flag}</span> {row.country}</td>
      <td style={{ ...s.td, ...s.priceCell }}>
        {f.price != null ? `${f.price} ${curr}` : "—"}
      </td>
      <td style={s.td}>{formatDuration(f.duration)}</td>
      <td style={s.td}>{f.stops != null ? (f.stops === 0 ? "Direct" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`) : "—"}</td>
      <td style={s.td}>{f.airline ?? "—"}</td>
      <td style={s.td}>{f.departDate ?? "—"}</td>
      <td style={s.td}>
        {f.deepLink ? (
          <a href={f.deepLink} target="_blank" rel="noopener noreferrer" style={s.bookLink}>
            Book →
          </a>
        ) : "—"}
      </td>
    </tr>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function durationMinutes(duration) {
  if (duration == null) return Infinity;
  // duration may be "8h 30m", or seconds (number), or "PT8H30M"
  if (typeof duration === "number") return Math.round(duration / 60);
  const hMatch = duration.match(/(\d+)\s*h/);
  const mMatch = duration.match(/(\d+)\s*m/);
  const h = hMatch ? parseInt(hMatch[1]) : 0;
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  return h * 60 + m;
}

function formatDuration(duration) {
  if (duration == null) return "—";
  if (typeof duration === "number") {
    const h = Math.floor(duration / 3600);
    const m = Math.floor((duration % 3600) / 60);
    return `${h}h ${m}m`;
  }
  return duration;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root: {
    minHeight: "100vh",
    background: "#f1f5f9",
  },
  topBar: {
    background: "#0f172a",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    borderBottom: "1px solid #1e293b",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },
  title: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  body: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px",
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: 24,
    alignItems: "start",
  },

  // Sidebar
  sidebar: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sidebarHeading: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: 4,
  },
  listPill: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid transparent",
    background: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "#475569",
    textAlign: "left",
    width: "100%",
  },
  listPillActive: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
  },
  listPillName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  listPillCount: {
    fontSize: 11,
    background: "#e2e8f0",
    borderRadius: 10,
    padding: "1px 6px",
    marginLeft: 6,
    flexShrink: 0,
  },
  newListBtn: {
    background: "none",
    border: "1px dashed #cbd5e1",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    color: "#64748b",
    cursor: "pointer",
    textAlign: "left",
    marginTop: 2,
  },
  newListForm: {
    display: "flex",
    gap: 4,
    marginTop: 2,
  },
  newListInput: {
    flex: 1,
    fontSize: 12,
    padding: "5px 8px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    minWidth: 0,
  },
  newListSave: {
    fontSize: 12,
    padding: "5px 8px",
    borderRadius: 6,
    border: "1px solid #3b82f6",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
  },
  newListCancel: {
    fontSize: 12,
    padding: "5px 8px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    color: "#6b7280",
  },
  countryList: {
    marginTop: 10,
    borderTop: "1px solid #f1f5f9",
    paddingTop: 10,
  },
  countryListHeading: {
    fontSize: 10,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 6,
  },
  countryItem: {
    fontSize: 12,
    color: "#475569",
    padding: "2px 0",
  },
  emptyHint: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.5,
    marginTop: 8,
    padding: "0 2px",
  },

  // Main panel
  main: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  searchCard: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  dateRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  dateField: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: "1 1 140px",
  },
  dateLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  dateInput: {
    fontSize: 13,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
  },
  currSelect: {
    fontSize: 13,
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
  },
  searchBtn: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  searchBtnDisabled: {
    background: "#94a3b8",
    cursor: "not-allowed",
  },

  // Results table
  tableWrap: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    padding: "10px 14px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    whiteSpace: "nowrap",
  },
  thSortable: {
    cursor: "pointer",
    userSelect: "none",
  },
  thActive: {
    color: "#2563eb",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  trMuted: {
    opacity: 0.6,
  },
  td: {
    padding: "10px 14px",
    verticalAlign: "middle",
  },
  flag: {
    marginRight: 6,
  },
  priceCell: {
    fontWeight: 600,
    color: "#0f172a",
  },
  skeleton: {
    background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
    backgroundSize: "200% 100%",
    animation: "skeleton 1.4s infinite",
    borderRadius: 4,
    height: 16,
  },
  noFlight: {
    color: "#94a3b8",
    fontSize: 12,
  },
  bookLink: {
    color: "#2563eb",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: 12,
  },
  disclaimer: {
    fontSize: 11,
    color: "#94a3b8",
    padding: "8px 14px",
    borderTop: "1px solid #f1f5f9",
    margin: 0,
  },
  noResults: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    padding: "40px 0",
  },
};
