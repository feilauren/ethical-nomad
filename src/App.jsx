import { useState, useRef, useEffect } from "react";
import { FlightSearch } from "./components/FlightSearch";
import { TravelAnywhere } from "./components/TravelAnywhere";
import { REGIONS, ALL_REGION_NAMES } from "./utils/regions";
import { useLists } from "./hooks/useLists";

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView]               = useState("browse"); // "browse" | "anywhere"
  const [activeRegion, setActiveRegion] = useState("All");
  const [selected, setSelected]       = useState(null); // { name, flag, tag }

  const listsApi = useLists();

  const visibleCountries =
    activeRegion === "All"
      ? Object.values(REGIONS).flat()
      : REGIONS[activeRegion] ?? [];

  if (view === "anywhere") {
    return (
      <TravelAnywhere
        lists={listsApi.lists}
        onCreateList={listsApi.createList}
        onBack={() => setView("browse")}
      />
    );
  }

  return (
    <div style={s.root}>
      <Header onAnywhere={() => setView("anywhere")} />

      {selected ? (
        <DetailView
          country={selected}
          onBack={() => setSelected(null)}
          listsApi={listsApi}
        />
      ) : (
        <>
          <RegionNav active={activeRegion} onChange={setActiveRegion} />
          <CountryGrid
            countries={visibleCountries}
            onSelect={setSelected}
            listsApi={listsApi}
          />
        </>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ onAnywhere }) {
  return (
    <header style={s.header}>
      <div style={s.headerInner}>
        <div>
          <div style={s.logo}>Ethical Nomad</div>
          <div style={s.tagline}>Find your next base</div>
        </div>
        <button onClick={onAnywhere} style={s.anywhereBtn}>
          Travel Anywhere ✈
        </button>
      </div>
    </header>
  );
}

// ── Region nav ────────────────────────────────────────────────────────────────

function RegionNav({ active, onChange }) {
  return (
    <div style={s.navWrapper}>
      <div style={s.nav}>
        {ALL_REGION_NAMES.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            style={{ ...s.navBtn, ...(active === r ? s.navBtnActive : {}) }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Country grid ──────────────────────────────────────────────────────────────

function CountryGrid({ countries, onSelect, listsApi }) {
  return (
    <main style={s.grid}>
      {countries.map((c) => (
        <CountryCard
          key={c.name}
          country={c}
          onSelect={onSelect}
          listsApi={listsApi}
        />
      ))}
    </main>
  );
}

// ── Country card with bookmark ────────────────────────────────────────────────

function CountryCard({ country, onSelect, listsApi }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const wrapRef = useRef(null);

  const inAnyList = listsApi.isInAnyList(country.name);
  const countryLists = listsApi.getListsForCountry(country.name);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popoverOpen]);

  function handleBookmark(e) {
    e.stopPropagation();

    if (listsApi.lists.length === 1) {
      // Single list: toggle immediately
      const list = listsApi.lists[0];
      if (list.countries.includes(country.name)) {
        listsApi.removeCountry(list.id, country.name);
      } else {
        listsApi.addCountry(list.id, country.name);
      }
    } else {
      // Multiple lists: show popover
      setPopoverOpen((v) => !v);
    }
  }

  function toggleInList(list) {
    if (list.countries.includes(country.name)) {
      listsApi.removeCountry(list.id, country.name);
    } else {
      listsApi.addCountry(list.id, country.name);
    }
  }

  return (
    <div ref={wrapRef} style={s.cardWrap}>
      <button style={s.card} onClick={() => onSelect(country)}>
        <span style={s.flag}>{country.flag}</span>
        <span style={s.countryName}>{country.name}</span>
        <span style={s.countryTag}>{country.tag}</span>
      </button>

      {/* Bookmark button */}
      <button
        onClick={handleBookmark}
        style={{ ...s.bookmark, ...(inAnyList ? s.bookmarkActive : {}) }}
        title={inAnyList ? "Remove from list" : "Add to list"}
      >
        {inAnyList ? "★" : "☆"}
      </button>

      {/* Multi-list popover */}
      {popoverOpen && (
        <div style={s.popover}>
          <div style={s.popoverTitle}>Add to list</div>
          {listsApi.lists.map((list) => {
            const checked = list.countries.includes(country.name);
            return (
              <label key={list.id} style={s.popoverItem}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleInList(list)}
                  style={s.popoverCheck}
                />
                <span style={s.popoverLabel}>{list.name}</span>
                <span style={s.popoverCount}>{list.countries.length}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────

function DetailView({ country, onBack, listsApi }) {
  const inAnyList = listsApi.isInAnyList(country.name);

  function handleQuickAdd() {
    const list = listsApi.lists[0];
    if (!list) return;
    if (list.countries.includes(country.name)) {
      listsApi.removeCountry(list.id, country.name);
    } else {
      listsApi.addCountry(list.id, country.name);
    }
  }

  return (
    <main style={s.detail}>
      <button onClick={onBack} style={s.backBtn}>
        ← Back to destinations
      </button>

      <div style={s.detailHeader}>
        <span style={s.detailFlag}>{country.flag}</span>
        <div style={{ flex: 1 }}>
          <h1 style={s.detailName}>{country.name}</h1>
          <p style={s.detailTag}>{country.tag}</p>
        </div>
        <button
          onClick={handleQuickAdd}
          style={{ ...s.detailBookmark, ...(inAnyList ? s.detailBookmarkActive : {}) }}
          title={inAnyList ? "Remove from list" : "Save to list"}
        >
          {inAnyList ? "★ Saved" : "☆ Save"}
        </button>
      </div>

      <FlightSearch countryName={country.name} defaultCurr="EUR" />
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root: {
    minHeight: "100vh",
    background: "#f1f5f9",
  },

  // Header
  header: {
    background: "#0f172a",
    borderBottom: "1px solid #1e293b",
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "-0.3px",
  },
  tagline: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  anywhereBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },

  // Region nav
  navWrapper: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    overflowX: "auto",
  },
  nav: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    gap: 4,
  },
  navBtn: {
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "color 0.15s",
  },
  navBtnActive: {
    color: "#2563eb",
    borderBottomColor: "#2563eb",
  },

  // Country grid
  grid: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
  },

  // Card
  cardWrap: {
    position: "relative",
  },
  card: {
    width: "100%",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center",
  },
  flag: {
    fontSize: 36,
    lineHeight: 1,
  },
  countryName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
  },
  countryTag: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 1.3,
  },
  bookmark: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    border: "none",
    background: "rgba(255,255,255,0.85)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backdropFilter: "blur(4px)",
  },
  bookmarkActive: {
    color: "#f59e0b",
  },

  // Multi-list popover
  popover: {
    position: "absolute",
    top: 34,
    right: 6,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    padding: "10px 0",
    zIndex: 100,
    minWidth: 170,
  },
  popoverTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "0 12px 8px",
  },
  popoverItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 13,
  },
  popoverCheck: {
    cursor: "pointer",
  },
  popoverLabel: {
    flex: 1,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  popoverCount: {
    fontSize: 11,
    color: "#94a3b8",
    flexShrink: 0,
  },

  // Detail view
  detail: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "24px",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
    marginBottom: 20,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    background: "#fff",
    borderRadius: 12,
    padding: "20px 24px",
    border: "1px solid #e2e8f0",
  },
  detailFlag: {
    fontSize: 52,
    lineHeight: 1,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
  },
  detailTag: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  detailBookmark: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  detailBookmarkActive: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
  },
};
