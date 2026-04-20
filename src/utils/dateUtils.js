export const toKey = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const fmtKey = (k) => {
  const [y, m, d] = k.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};

export const getDays  = (y, m) => new Date(y, m + 1, 0).getDate();
export const getFirst = (y, m) => new Date(y, m, 1).getDay();

/** "YYYY-MM-DD" → "DD/MM/YYYY" (for the flights API) */
export const keyToApiDate = (k) => {
  const [y, m, d] = k.split("-");
  return `${d}/${m}/${y}`;
};

/** JS Date → "YYYY-MM-DD" */
export const toInputKey = (date) => date.toISOString().slice(0, 10);

/** Add/subtract days from a "YYYY-MM-DD" key */
export const shiftKey = (k, days) => {
  const [y, m, d] = k.split("-");
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toInputKey(dt);
};
