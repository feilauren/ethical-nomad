import { useState, useCallback, useRef } from "react";

const FLIGHTS_API = "/api/flights";

/**
 * Formats a JS Date to DD/MM/YYYY for the flights API.
 */
function formatDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Hook to search for one-way flights via the /api/flights proxy.
 *
 * Returns:
 *   search(params)  — trigger a search
 *   flights         — array of flight results
 *   loading         — boolean
 *   error           — string | null
 *   clear()         — reset state
 */
export function useFlightSearch() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const search = useCallback(async ({ flyFrom, flyTo, dateFrom, dateTo, curr = "CAD" }) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setFlights([]);

    try {
      const params = new URLSearchParams({
        fly_from: flyFrom,
        fly_to: flyTo,
        date_from: typeof dateFrom === "string" ? dateFrom : formatDate(dateFrom),
        date_to: typeof dateTo === "string" ? dateTo : formatDate(dateTo),
        curr,
        limit: "3",
      });

      const res = await fetch(`${FLIGHTS_API}?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setFlights(data.flights ?? []);
    } catch (err) {
      if (err.name === "AbortError") return; // ignore cancellations
      setError(err.message || "Failed to load flights");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setFlights([]);
    setError(null);
    setLoading(false);
  }, []);

  return { search, flights, loading, error, clear };
}
