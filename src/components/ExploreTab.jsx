import { useState, useMemo, useRef, useEffect } from "react";
import { countries, HR, INFRA, CONTINENTS, COST_TIERS } from "../data/countries";
import { Btn } from "./shared";

export function ExploreTab({ favorites, toggleFav, listsApi, onOpenModal }) {
  const [continent, setContinent] = useState("All");
  const [costTier,  setCostTier]  = useState("All");
  const [safeOnly,  setSafeOnly]  = useState(false);
  const [hrOnly,    setHrOnly]    = useState(false);
  const [favOnly,   setFavOnly]   = useState(false);

  const filtered = useMemo(() => {
    const tier = COST_TIERS.find((t) => t.label === costTier) ?? COST_TIERS[0];
    return countries.filter((c) => {
      if (continent !== "All" && c.continent !== continent) return false;
      if (c.weekCost < tier.min || c.weekCost > tier.max) return false;
      if (safeOnly && c.safety !== "good") return false;
      if (hrOnly && c.hrLevel !== "clear") return false;
      if (favOnly && !favorites.includes(c.name)) return false;
      return true;
    });
  }, [continent, costTier, safeOnly, hrOnly, favOnly, favorites]);

  return (
    <div style={s.root}>
      {/* Filter bar */}
      <div style={s.filterBar}>
        <FilterGroup label="Region">
          {CONTINENTS.map((c) => (
            <Btn key={c} active={continent === c} onClick={() => setContinent(c)} small>
              {c}
            </Btn>
          ))}
        </FilterGroup>

        <FilterGroup label="Budget/wk">
          {COST_TIERS.map((t) => (
            <Btn key={t.label} active={costTier === t.label} onClick={() => setCostTier(t.label)} small>
              {t.label}
            </Btn>
          ))}
        </FilterGroup>

        <FilterGroup label="Filters">
          <Btn active={safeOnly} onClick={() => setSafeOnly((v) => !v)} small col="#16a34a">
            ✓ Safe only
          </Btn>
          <Btn active={hrOnly} onClick={() => setHrOnly((v) => !v)} small col="#16a34a">
            HR clear only
          </Btn>
          <Btn active={favOnly} onClick={() => setFavOnly((v) => !v)} small col="#6366f1">
            💜 Saved only
          </Btn>
        </FilterGroup>
      </div>

      {/* Count */}
      <div style={s.countRow}>
        <span style={s.count}>{filtered.length} destination{filtered.length !== 1 ? "s" : ""}</span>
        {(continent !== "All" || costTier !== "All" || safeOnly || hrOnly || favOnly) && (
          <button
            onClick={() => { setContinent("All"); setCostTier("All"); setSafeOnly(false); setHrOnly(false); setFavOnly(false); }}
            style={s.clearBtn}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      <div style={s.grid}>
        {filtered.map((c) => (
          <CountryCard
            key={c.name}
            country={c}
            isFav={favorites.includes(c.name)}
            onToggleFav={() => toggleFav(c.name)}
            listsApi={listsApi}
            onOpen={() => onOpenModal(c)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={s.empty}>No destinations match your filters.</p>
      )}
    </div>
  );
}

// ── Country card ──────────────────────────────────────────────────────────────

function CountryCard({ country: c, isFav, onToggleFav, listsApi, onOpen }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const wrapRef = useRef(null);
  const inList = listsApi.isInAnyList(c.name);

  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setPopoverOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  function handleListBtn(e) {
    e.stopPropagation();
    if (listsApi.lists.length === 1) {
      const list = listsApi.lists[0];
      if (list.countries.includes(c.name)) listsApi.removeCountry(list.id, c.name);
      else listsApi.addCountry(list.id, c.name);
    } else {
      setPopoverOpen((v) => !v);
    }
  }

  return (
    <div ref={wrapRef} style={s.cardWrap}>
      <button style={s.card} onClick={onOpen}>
        <div style={s.cardTop}>
          <span style={s.flag}>{c.flag}</span>
          <div style={s.cardBtns}>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
              style={{ ...s.iconBtn, color: isFav ? "#6366f1" : "#cbd5e1" }}
              title={isFav ? "Unsave" : "Save"}
            >
              💜
            </button>
            <button
              onClick={handleListBtn}
              style={{ ...s.iconBtn, color: inList ? "#f59e0b" : "#cbd5e1" }}
              title={inList ? "In trip list" : "Add to trip list"}
            >
              {inList ? "★" : "☆"}
            </button>
          </div>
        </div>

        <div style={s.name}>{c.name}</div>

        <div style={s.meta}>
          <span style={{ color: c.weekCost < 500 ? "#16a34a" : c.weekCost < 900 ? "#d97706" : "#dc2626", fontWeight: 600, fontSize: 11 }}>
            ${c.costLow}–${c.costHigh}
          </span>
          <span style={{ color: c.safety === "good" ? "#16a34a" : "#d97706", fontSize: 11 }}>
            {c.safety === "good" ? "✓" : "⚠"}
          </span>
          <span style={{ color: HR[c.hrLevel].color, fontSize: 11 }}>●</span>
        </div>

        <div style={s.infra}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} style={{ width: 5, height: 5, borderRadius: 1, background: n <= c.infraRating ? "#6366f1" : "#e2e8f0" }} />
          ))}
        </div>
      </button>

      {/* Multi-list popover */}
      {popoverOpen && (
        <div style={s.popover}>
          <div style={s.popoverTitle}>Add to list</div>
          {listsApi.lists.map((list) => {
            const checked = list.countries.includes(c.name);
            return (
              <label key={list.id} style={s.popoverItem}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) listsApi.removeCountry(list.id, c.name);
                    else listsApi.addCountry(list.id, c.name);
                  }}
                />
                <span style={{ flex: 1, fontSize: 12 }}>{list.name}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{list.countries.length}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Filter group ──────────────────────────────────────────────────────────────

function FilterGroup({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root: { background: "#f8fafc", minHeight: "calc(100vh - 52px)" },
  filterBar: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px 24px",
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  countRow: {
    padding: "10px 24px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  count: { fontSize: 12, color: "#64748b" },
  clearBtn: {
    fontSize: 11, color: "#6366f1", background: "none",
    border: "none", cursor: "pointer", padding: 0, fontWeight: 500,
  },
  grid: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px 32px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
    gap: 12,
  },
  cardWrap: { position: "relative" },
  card: {
    width: "100%",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "14px 14px 12px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    transition: "box-shadow 0.15s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  flag: { fontSize: 28, lineHeight: 1 },
  cardBtns: { display: "flex", gap: 2 },
  iconBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 14, padding: "2px 3px", lineHeight: 1,
  },
  name: {
    fontSize: 13, fontWeight: 700, color: "#0f172a",
  },
  meta: {
    display: "flex", gap: 8, alignItems: "center",
  },
  infra: {
    display: "flex", gap: 3, alignItems: "center",
  },
  empty: {
    textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "60px 0",
  },
  popover: {
    position: "absolute",
    top: 44,
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
    fontSize: 10, fontWeight: 700, color: "#94a3b8",
    textTransform: "uppercase", letterSpacing: "0.5px",
    padding: "0 12px 6px",
  },
  popoverItem: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 12px", cursor: "pointer", fontSize: 13,
  },
};
