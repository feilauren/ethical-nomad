import { useState, useEffect, useCallback } from "react";

function sessionHeaders(session) {
  return {
    "Content-Type": "application/json",
    "X-Session": JSON.stringify(session),
  };
}

export function useSchengen(session) {
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/schengen/trips", { headers: sessionHeaders(session) });
      const data = await res.json();
      if (res.ok) setTrips(data.trips ?? []);
    } catch {
      // network error — keep existing trips
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  async function addTrip(entry_date, exit_date, label) {
    const res  = await fetch("/api/schengen/trips", {
      method: "POST",
      headers: sessionHeaders(session),
      body: JSON.stringify({ entry_date, exit_date: exit_date || null, label: label || null }),
    });
    const data = await res.json();
    if (res.ok) setTrips((prev) => [data.trip, ...prev]);
    return res.ok;
  }

  async function updateTrip(id, patch) {
    const res  = await fetch("/api/schengen/trips", {
      method: "PUT",
      headers: sessionHeaders(session),
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (res.ok) setTrips((prev) => prev.map((t) => t.id === id ? data.trip : t));
    return res.ok;
  }

  async function deleteTrip(id) {
    const res = await fetch("/api/schengen/trips", {
      method: "DELETE",
      headers: sessionHeaders(session),
      body: JSON.stringify({ id }),
    });
    if (res.ok) setTrips((prev) => prev.filter((t) => t.id !== id));
    return res.ok;
  }

  return { trips, loading, addTrip, updateTrip, deleteTrip, refresh };
}
