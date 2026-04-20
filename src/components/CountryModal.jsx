import { useRef, useEffect } from "react";
import { FlightSearch } from "./FlightSearch";
import { HR, INFRA } from "../data/countries";

export function CountryModal({ c, onClose, favorites, toggleFav, listsApi }) {
  const isFav   = favorites.includes(c.name);
  const hrColor = HR[c.hrLevel].color;
  const inList  = listsApi.isInAnyList(c.name);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 50, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, width: "100%",
          maxWidth: 640, maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* ── Sticky header ── */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{c.flag}</span>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{c.name}</h2>
                {c.schengen && (
                  <span style={{ fontSize: 10, background: "#ede9fe", color: "#7c3aed", padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>
                    Schengen
                  </span>
                )}
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(c.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "#2563eb", textDecoration: "none", background: "#eff6ff", padding: "2px 9px", borderRadius: 4, border: "1px solid #bfdbfe", fontWeight: 500 }}
                >
                  🗺 Maps
                </a>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: c.weekCost < 500 ? "#16a34a" : c.weekCost < 900 ? "#d97706" : "#dc2626", fontWeight: 700, fontSize: 14 }}>
                  ${c.costLow}–${c.costHigh} CAD/wk
                </span>
                <span style={{ color: c.safety === "good" ? "#16a34a" : "#d97706", fontSize: 12 }}>
                  {c.safety === "good" ? "✓ Safe" : "⚠ Regional"}
                </span>
                <span style={{ color: hrColor, fontSize: 12, fontWeight: 600 }}>
                  ● {HR[c.hrLevel].label}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={() => toggleFav(c.name)}
                style={{
                  padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: isFav ? "#f5f3ff" : "#fff",
                  color: isFav ? "#6366f1" : "#64748b",
                  cursor: "pointer", fontSize: 13, fontWeight: isFav ? 700 : 400,
                }}
              >
                {isFav ? "💜 Saved" : "💜 Save"}
              </button>
              {listsApi && (
                <button
                  onClick={() => {
                    const list = listsApi.lists[0];
                    if (!list) return;
                    if (list.countries.includes(c.name)) listsApi.removeCountry(list.id, c.name);
                    else listsApi.addCountry(list.id, c.name);
                  }}
                  style={{
                    padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: inList ? "#fef3c7" : "#fff",
                    color: inList ? "#92400e" : "#64748b",
                    cursor: "pointer", fontSize: 13,
                  }}
                  title={inList ? "Remove from trip list" : "Add to trip list"}
                >
                  {inList ? "★" : "☆"}
                </button>
              )}
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 22, padding: "0 4px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Where to Go */}
          <div>
            <SectionLabel>Where to Go</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {c.cities.split("\n").map((line, i) => {
                const isS = line.startsWith("★");
                const isA = line.startsWith("⚠");
                const isG = line.startsWith("◆");
                const bg     = isA ? "#fef2f2" : isS ? "#fffbeb" : isG ? "#f0fdf4" : "#f8fafc";
                const border = isA ? "#fecaca" : isS ? "#fde68a" : isG ? "#bbf7d0" : "#e2e8f0";
                const lc     = isA ? "#dc2626" : isS ? "#d97706" : "#16a34a";
                const lbl    = isA ? "Avoid" : isS ? "Tourist-oriented" : "Indifferent";
                return (
                  <div key={i} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: lc, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{lbl}</div>
                    <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5 }}>{line.replace(/^[★◆⚠]\s*/, "")}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Culture */}
          <div>
            <SectionLabel>Without the Performance</SectionLabel>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#334155", lineHeight: 1.8, borderLeft: "3px solid #6366f1" }}>
              {c.culture}
            </div>
          </div>

          {/* Logistics */}
          <div>
            <SectionLabel>Logistics</SectionLabel>
            <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} style={{ width: 6, height: 6, borderRadius: 1, background: n <= c.infraRating ? "#6366f1" : "#e2e8f0" }} />
                  ))}
                  <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginLeft: 2 }}>{INFRA[c.infraRating]}</span>
                </div>
                <span style={{ fontSize: 11, color: c.schengen ? "#7c3aed" : "#94a3b8" }}>
                  {c.schengen ? "● Schengen" : "○ Non-Schengen"}
                </span>
                <span style={{ fontSize: 11, color: "#64748b" }}>Peak: {c.peak}</span>
              </div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7 }}>{c.logistics}</div>
            </div>
          </div>

          {/* HR */}
          {c.hrLevel !== "clear" && (
            <div>
              <SectionLabel style={{ color: hrColor }}>Human Rights — {HR[c.hrLevel].label}</SectionLabel>
              <div style={{
                background: c.hrLevel === "severe" ? "#fef2f2" : "#fffbeb",
                border: `1px solid ${c.hrLevel === "severe" ? "#fecaca" : "#fde68a"}`,
                borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#475569", lineHeight: 1.7,
              }}>
                {c.hrSummary}
              </div>
            </div>
          )}

          {/* Flights */}
          <div>
            <SectionLabel>Cheapest Flights</SectionLabel>
            <FlightSearch countryName={c.name} defaultCurr="EUR" />
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 10, color: "#94a3b8", textTransform: "uppercase",
      letterSpacing: 1, marginBottom: 8, fontWeight: 700, ...style,
    }}>
      {children}
    </div>
  );
}
