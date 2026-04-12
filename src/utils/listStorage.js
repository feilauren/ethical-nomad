const KEY = "en-lists";

const DEFAULT_LIST = () => ({
  id: crypto.randomUUID(),
  name: "My List",
  createdAt: new Date().toISOString(),
  countries: [],
});

export function loadLists() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveLists(lists) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lists));
  } catch {
    // storage full or unavailable — fail silently
  }
}

export function initialLists() {
  return loadLists() ?? [DEFAULT_LIST()];
}
