const FLIGHTS_API = "/api/flights";

/**
 * Formats a JS Date or DD/MM/YYYY string to DD/MM/YYYY for the flights API.
 */
export function formatDate(date) {
  if (typeof date === "string") return date;
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Fetches one-way flights from the /api/flights proxy.
 *
 * @param {{ flyFrom, flyTo, dateFrom, dateTo, curr?, limit?, signal? }} opts
 * @returns {Promise<Array>} resolved flight objects
 * @throws on non-200 responses or network errors (AbortError propagates)
 */
export async function fetchFlights({ flyFrom, flyTo, dateFrom, dateTo, curr = "EUR", limit = 3, signal }) {
  const params = new URLSearchParams({
    fly_from:  flyFrom,
    fly_to:    flyTo,
    date_from: formatDate(dateFrom),
    date_to:   formatDate(dateTo),
    curr,
    limit:     String(limit),
  });

  const res = await fetch(`${FLIGHTS_API}?${params}`, { signal });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.flights ?? [];
}
