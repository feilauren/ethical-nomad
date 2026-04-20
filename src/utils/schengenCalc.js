/**
 * Schengen 90/180 rule calculator.
 *
 * Each trip: { entry_date: "YYYY-MM-DD", exit_date: "YYYY-MM-DD" | null }
 * exit_date = null means the person is currently in the Schengen area.
 */

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** True if `day` (YYYY-MM-DD string) falls within a trip. */
function inTrip(day, trip) {
  const entry = trip.entry_date;
  const exit  = trip.exit_date ?? dateStr(new Date()); // null = today
  return day >= entry && day <= exit;
}

/**
 * Count how many days within [asOf-179 … asOf] the person was in Schengen.
 * asOf defaults to today.
 */
export function daysUsed(trips, asOf = new Date()) {
  const end   = new Date(asOf);
  const start = addDays(end, -179);
  let count = 0;
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const key = dateStr(d);
    if (trips.some((t) => inTrip(key, t))) count++;
  }
  return count;
}

/** Days remaining in the current 180-day window. */
export function daysRemaining(trips, asOf = new Date()) {
  return 90 - daysUsed(trips, asOf);
}

/**
 * Validate a proposed future trip.
 * Returns { ok, daysWouldUse, overBy }
 * "daysWouldUse" = how many of the proposed days fall in the rolling window ending on exitDate.
 */
export function validateTrip(trips, entryDate, exitDate) {
  if (!entryDate || !exitDate) return { ok: true, daysWouldUse: 0, overBy: 0 };

  const proposed = { entry_date: entryDate, exit_date: exitDate };
  const allTrips = [...trips, proposed];
  const used = daysUsed(allTrips, new Date(exitDate));
  const overBy = Math.max(0, used - 90);

  return { ok: overBy === 0, daysWouldUse: used, overBy };
}

/**
 * Earliest date on which a stay of `stayLength` days would be legal,
 * starting from `from` (default: today).
 * Scans forward up to 365 days.
 */
export function earliestEntry(trips, stayLength = 1, from = new Date()) {
  for (let i = 0; i < 365; i++) {
    const candidate = addDays(from, i);
    const proposed  = {
      entry_date: dateStr(candidate),
      exit_date:  dateStr(addDays(candidate, stayLength - 1)),
    };
    const { ok } = validateTrip(trips, proposed.entry_date, proposed.exit_date);
    if (ok) return candidate;
  }
  return null;
}

/** Format a YYYY-MM-DD string to "15 Jan" style. */
export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Days between two YYYY-MM-DD strings (inclusive). */
export function tripDays(entry, exit) {
  if (!exit) {
    const diff = Math.floor((new Date() - new Date(entry + "T00:00:00")) / 86400000);
    return Math.max(0, diff) + 1;
  }
  const diff = Math.floor((new Date(exit + "T00:00:00") - new Date(entry + "T00:00:00")) / 86400000);
  return Math.max(0, diff) + 1;
}
