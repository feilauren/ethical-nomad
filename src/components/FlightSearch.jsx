import { useState, useEffect, useCallback } from "react";
import { useFlightSearch } from "../hooks/useFlightSearch";
import { AirportSelector, buildFlyFrom, getAirportLabel } from "./AirportSelector";
import { getFlightDestination } from "../utils/countryToIata";

/**
 * FlightSearch
 *
 * Drop this into your country detail modal.
 *
 * Props:
 *   countryName  — string, e.g. "Thailand"
 *   defaultCurr  — ISO currency code, default "CAD"
 *
 * Usage:
 *   <FlightSearch countryName={selectedCountry.name} />
 */
export function FlightSearch({ countryName, defaultCurr = "CAD" }) {
  const flyTo = getFlightDestination(countryName);

  // Default date range: next 30 days, up to 90 days out
  const today = new Date();
  const thirtyDays = new Date(today);
  thirtyDays.setDate(today.getDate() + 30);
  const ninetyDays = new Date(today);
  ninetyDays.setDate(today.getDate() + 90);

  const [airports, setAirports] = useState({
    homeKey: "Düsseldorf (DUS)",
    enabled: new Set(["DUS"]),
  });

  const [dateFrom, setDateFrom] = useState(toInputDate(today));
  const [dateTo, setDateTo]     = useState(toInputDate(thirtyDays));

  const { search, flights, loading, error, clear } = useFlightSearch();

  // Re-run when airports or dates change (debounced via button, not auto)
  const handleSearch = useCallback(() => {
    const flyFrom = buildFlyFrom(airports);
    if (!flyFrom || !flyTo) return;

    search({
      flyFrom,
      flyTo,
      dateFrom: toApiDate(dateFrom),
      dateTo:   toApiDate(dateTo),
      curr: defaultCurr,
    });
  }, [airports, dateFrom, dateTo, flyTo, defaultCurr, search]);

  // Clear results when country changes
  useEffect(() => {
    clear();
  }, [countryName, clear]);

  if (!flyTo) {
    return (
      <div style={styles.unsupported}>
        Flight search not available for {countryName}.
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Cheapest one-way flights to {countryName}</h3>

      {/* Controls */}
      <div style={styles.controls}>
        <AirportSelector value={airports} onChange={setAirports} />

        <div style={styles.dateRow}>
          <label style={styles.label}>Depart between</label>
          <input
            type="date"
            value={dateFrom}
            min={toInputDate(today)}
            onChange={(e) => setDateFrom(e.target.value)}
            style={styles.dateInput}
          />
          <span style={styles.label}>and</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom}
            onChange={(e) => setDateTo(e.target.value)}
            style={styles.dateInput}
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          style={{ ...styles.searchBtn, ...(loading ? styles.searchBtnDisabled : {}) }}
        >
          {loading ? "Searching…" : "Search flights"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && !error && flights.length > 0 && (
        <div style={styles.results}>
          {flights.map((f) => (
            <FlightCard key={f.id} flight={f} />
          ))}
          <p style={styles.disclaimer}>
            Prices from Skyscanner · Click to book · Fares may vary
          </p>
        </div>
      )}

      {/* Empty state after search */}
      {!loading && !error && flights.length === 0 && (
        <p style={styles.empty}>
          No flights found for the selected dates and airports.
          Try a wider date range or additional nearby airports.
        </p>
      )}
    </div>
  );
}

// ── Flight Card ───────────────────────────────────────────────────────────────

function FlightCard({ flight }) {
  const departureDate = formatLocalDate(flight.departure.time);
  const durationStr   = formatDuration(flight.duration_minutes);
  const stopsStr      = flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;
  const airlineList   = flight.airlines.join(", ") || flight.airline;

  return (
    <a
      href={flight.deep_link}
      target="_blank"
      rel="noopener noreferrer"
      style={styles.card}
    >
      {/* Price badge */}
      <div style={styles.price}>
        <span style={styles.priceAmount}>
          {flight.currency} {flight.price.toLocaleString()}
        </span>
      </div>

      {/* Route */}
      <div style={styles.route}>
        <div style={styles.airport}>
          <span style={styles.iata}>{flight.departure.airport}</span>
          <span style={styles.city}>{getAirportLabel(flight.departure.airport)}</span>
        </div>
        <div style={styles.arrow}>
          <span style={styles.arrowLine}>──────</span>
          <span style={styles.arrowHead}>✈</span>
        </div>
        <div style={styles.airport}>
          <span style={styles.iata}>{flight.arrival.airport}</span>
          <span style={styles.city}>{flight.arrival.city}</span>
        </div>
      </div>

      {/* Meta row */}
      <div style={styles.meta}>
        <span>{departureDate}</span>
        <span style={styles.dot}>·</span>
        <span>{durationStr}</span>
        <span style={styles.dot}>·</span>
        <span style={stopsStr === "Direct" ? styles.direct : {}}>{stopsStr}</span>
        <span style={styles.dot}>·</span>
        <span>{airlineList}</span>
      </div>
    </a>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "2025-04-15" → Date input value */
function toInputDate(date) {
  return date.toISOString().split("T")[0];
}

/** "2025-04-15" → "15/04/2025" (DD/MM/YYYY) */
function toApiDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/** "2025-04-15T10:30:00.000Z" → "15 Apr 2025" */
function formatLocalDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** 185 → "3h 5m" */
function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    borderTop: "1px solid #e5e7eb",
    marginTop: "8px",
  },
  heading: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "600",
    color: "#111827",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  dateRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  label: {
    fontSize: "13px",
    color: "#6b7280",
    whiteSpace: "nowrap",
  },
  dateInput: {
    fontSize: "13px",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#fff",
  },
  searchBtn: {
    alignSelf: "flex-start",
    padding: "7px 18px",
    borderRadius: "6px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  searchBtnDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },
  results: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    textDecoration: "none",
    color: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
    cursor: "pointer",
    ":hover": {
      borderColor: "#2563eb",
      boxShadow: "0 1px 6px rgba(37,99,235,0.12)",
    },
  },
  price: {
    display: "flex",
    justifyContent: "flex-end",
  },
  priceAmount: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#15803d",
  },
  route: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  airport: {
    display: "flex",
    flexDirection: "column",
  },
  iata: {
    fontSize: "18px",
    fontWeight: "700",
    letterSpacing: "0.05em",
    color: "#111827",
  },
  city: {
    fontSize: "11px",
    color: "#6b7280",
  },
  arrow: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "14px",
    gap: "2px",
  },
  arrowLine: {
    letterSpacing: "-3px",
    color: "#d1d5db",
  },
  arrowHead: {
    fontSize: "16px",
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#6b7280",
    flexWrap: "wrap",
  },
  dot: {
    color: "#d1d5db",
  },
  direct: {
    color: "#15803d",
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: 0,
    textAlign: "right",
  },
  error: {
    padding: "10px 14px",
    borderRadius: "6px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "13px",
  },
  empty: {
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
  },
  unsupported: {
    fontSize: "13px",
    color: "#9ca3af",
    fontStyle: "italic",
    padding: "8px 0",
  },
};
