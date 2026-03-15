import { useState } from "react";

/**
 * Airport definitions.
 * Each entry: { code, name, city, note }
 *
 * The "home" airport anchors the list; "nearby" airports are opt-in.
 * Users can swap the home airport entirely via the dropdown.
 */

const AIRPORT_GROUPS = {
  "Düsseldorf (DUS)": {
    home: { code: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf" },
    nearby: [
      { code: "CGN", name: "Cologne/Bonn Airport",  city: "Cologne",   note: "~45 min" },
      { code: "AMS", name: "Amsterdam Schiphol",    city: "Amsterdam", note: "~2 h train" },
      { code: "FRA", name: "Frankfurt Airport",     city: "Frankfurt", note: "~2.5 h train" },
      { code: "BRU", name: "Brussels Airport",      city: "Brussels",  note: "~2 h Thalys" },
    ],
  },
  "Amsterdam (AMS)": {
    home: { code: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam" },
    nearby: [
      { code: "DUS", name: "Düsseldorf Airport",   city: "Düsseldorf", note: "~2 h train" },
      { code: "BRU", name: "Brussels Airport",     city: "Brussels",   note: "~1.5 h Thalys" },
      { code: "CGN", name: "Cologne/Bonn Airport", city: "Cologne",    note: "~2.5 h train" },
      { code: "FRA", name: "Frankfurt Airport",    city: "Frankfurt",  note: "~3.5 h train" },
    ],
  },
  "Frankfurt (FRA)": {
    home: { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt" },
    nearby: [
      { code: "DUS", name: "Düsseldorf Airport",  city: "Düsseldorf", note: "~2.5 h train" },
      { code: "CGN", name: "Cologne/Bonn Airport", city: "Cologne",   note: "~1.5 h train" },
      { code: "MUC", name: "Munich Airport",       city: "Munich",    note: "~3 h train" },
      { code: "STR", name: "Stuttgart Airport",    city: "Stuttgart", note: "~1 h train" },
    ],
  },
  "London (LHR)": {
    home: { code: "LHR", name: "London Heathrow", city: "London" },
    nearby: [
      { code: "LGW", name: "London Gatwick",       city: "London",   note: "same metro area" },
      { code: "STN", name: "London Stansted",      city: "London",   note: "~1 h train" },
      { code: "LTN", name: "London Luton",         city: "London",   note: "~45 min train" },
      { code: "BRS", name: "Bristol Airport",      city: "Bristol",  note: "~1.5 h drive" },
    ],
  },
  "Barcelona (BCN)": {
    home: { code: "BCN", name: "Barcelona El Prat", city: "Barcelona" },
    nearby: [
      { code: "GRO", name: "Girona Airport",  city: "Girona",   note: "~1.5 h bus" },
      { code: "REU", name: "Reus Airport",    city: "Reus",     note: "~1.5 h bus" },
      { code: "VLC", name: "Valencia Airport", city: "Valencia", note: "~3 h train" },
    ],
  },
  "Lisbon (LIS)": {
    home: { code: "LIS", name: "Lisbon Humberto Delgado", city: "Lisbon" },
    nearby: [
      { code: "OPO", name: "Porto Airport",  city: "Porto",  note: "~3 h train" },
      { code: "FAO", name: "Faro Airport",   city: "Faro",   note: "~3 h bus" },
    ],
  },
};

/**
 * AirportSelector
 *
 * Props:
 *   value     — { homeKey: string, enabled: Set<string> }
 *   onChange  — (newValue) => void
 */
export function AirportSelector({ value, onChange }) {
  const homeKey = value?.homeKey ?? "Düsseldorf (DUS)";
  const enabled = value?.enabled ?? new Set([AIRPORT_GROUPS[homeKey]?.home.code]);

  const group = AIRPORT_GROUPS[homeKey];

  function setHomeKey(key) {
    const newHome = AIRPORT_GROUPS[key].home.code;
    onChange({ homeKey: key, enabled: new Set([newHome]) });
  }

  function toggleNearby(code) {
    const next = new Set(enabled);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    onChange({ homeKey, enabled: next });
  }

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <label style={styles.label}>Home airport</label>
        <select
          value={homeKey}
          onChange={(e) => setHomeKey(e.target.value)}
          style={styles.select}
        >
          {Object.keys(AIRPORT_GROUPS).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {group.nearby.length > 0 && (
        <div style={styles.nearbySection}>
          <span style={styles.nearbyLabel}>Include nearby:</span>
          <div style={styles.chips}>
            {group.nearby.map((ap) => {
              const active = enabled.has(ap.code);
              return (
                <button
                  key={ap.code}
                  onClick={() => toggleNearby(ap.code)}
                  style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                  title={ap.name}
                >
                  {ap.code}
                  <span style={styles.chipNote}>{ap.note}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Returns a comma-separated IATA string for the Tequila fly_from param.
 */
export function buildFlyFrom(selectorValue) {
  const { homeKey, enabled } = selectorValue;
  const group = AIRPORT_GROUPS[homeKey];
  if (!group) return "";

  const all = [group.home, ...group.nearby];
  return all
    .filter((ap) => enabled.has(ap.code))
    .map((ap) => ap.code)
    .join(",");
}

/**
 * Returns display label for a departure airport code.
 */
export function getAirportLabel(code) {
  for (const group of Object.values(AIRPORT_GROUPS)) {
    const all = [group.home, ...group.nearby];
    const found = all.find((ap) => ap.code === code);
    if (found) return `${found.code} – ${found.city}`;
  }
  return code;
}

export { AIRPORT_GROUPS };

// ── Inline styles (no CSS file dependency) ──────────────────────────────────

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    color: "#6b7280",
    whiteSpace: "nowrap",
  },
  select: {
    fontSize: "13px",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    flex: 1,
  },
  nearbySection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  nearbyLabel: {
    fontSize: "12px",
    color: "#9ca3af",
    whiteSpace: "nowrap",
  },
  chips: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  chip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    color: "#374151",
    lineHeight: 1.2,
    transition: "all 0.15s",
  },
  chipActive: {
    background: "#eff6ff",
    border: "1px solid #3b82f6",
    color: "#1d4ed8",
  },
  chipNote: {
    fontSize: "10px",
    fontWeight: "400",
    color: "#9ca3af",
  },
};
