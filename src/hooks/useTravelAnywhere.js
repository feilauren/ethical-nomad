import { useState, useRef, useCallback } from "react";
import { fetchFlights, formatDate } from "../utils/flightFetcher";
import { flagForCountry } from "../utils/regions";
import { getFlightDestination } from "../utils/countryToIata";

/**
 * Fan-out flight search: fires one request per country in the list concurrently.
 * Results stream in as each request settles (loading state per row).
 *
 * Returns:
 *   search(params)  — start a new fan-out search
 *   results         — [{ country, flag, flyTo, flight|null, loading, error }]
 *   anyLoading      — true while at least one request is still in-flight
 *   clear()         — reset all state
 */
export function useTravelAnywhere() {
  const [results, setResults] = useState([]);
  const abortRef = useRef(null);

  const search = useCallback(({ flyFrom, dateFrom, dateTo, curr = "EUR", countries }) => {
    // Cancel previous batch
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!countries || countries.length === 0) {
      setResults([]);
      return;
    }

    // Initialise all rows in loading state
    const initial = countries.map((country) => ({
      country,
      flag:    flagForCountry(country),
      flyTo:   getFlightDestination(country),
      flight:  null,
      loading: true,
      error:   null,
    }));
    setResults(initial);

    // Fire all requests concurrently; update each row as it settles
    countries.forEach((country) => {
      const flyTo = getFlightDestination(country);

      if (!flyTo) {
        setResults((prev) =>
          prev.map((r) =>
            r.country === country
              ? { ...r, loading: false, error: "Destination not mapped" }
              : r
          )
        );
        return;
      }

      fetchFlights({
        flyFrom,
        flyTo,
        dateFrom: formatDate(dateFrom),
        dateTo:   formatDate(dateTo),
        curr,
        limit: 1,
        signal: controller.signal,
      })
        .then((flights) => {
          setResults((prev) =>
            prev.map((r) =>
              r.country === country
                ? { ...r, loading: false, flight: flights[0] ?? null }
                : r
            )
          );
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setResults((prev) =>
            prev.map((r) =>
              r.country === country
                ? { ...r, loading: false, error: err.message || "No flights found" }
                : r
            )
          );
        });
    });
  }, []);

  const clear = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setResults([]);
  }, []);

  const anyLoading = results.some((r) => r.loading);

  return { search, results, anyLoading, clear };
}
