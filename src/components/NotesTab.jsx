import { useState, useMemo } from "react";
import { NoteModal } from "./NoteModal";
import { countries } from "../data/countries";

const flagMap = Object.fromEntries(countries.map((c) => [c.name, c.flag]));

export function NotesTab({ notesApi, lists }) {
  const { notes, loading, addNote, updateNote, deleteNote } = notesApi;

  const [filterCountry, setFilterCountry] = useState("");
  const [filterList,    setFilterList]    = useState("");
  const [modal,         setModal]         = useState(null); // null | "new" | noteObject

  // Unique countries that appear in notes
  const noteCountries = useMemo(() => {
    const set = new Set(notes.map((n) => n.country).filter(Boolean));
    return [...set].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (filterCountry && n.country !== filterCountry) return false;
      if (filterList    && n.list_id  !== filterList)    return false;
      return true;
    });
  }, [notes, filterCountry, filterList]);

  // Group by country (blank country → "Uncategorised")
  const grouped = useMemo(() => {
    const map = new Map();
    for (const n of filtered) {
      const key = n.country || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    }
    // Sort: named countries first, then uncategorised
    return [...map.entries()].sort(([a], [b]) => {
      if (!a && b) return 1;
      if (a && !b) return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  async function handleSave(fields) {
    if (modal === "new") {
      await addNote(fields);
    } else {
      await updateNote(modal.id, fields);
    }
    setModal(null);
  }

  async function handleDelete() {
    if (modal && modal !== "new") {
      await deleteNote(modal.id);
    }
    setModal(null);
  }

  return (
    <div style={s.root}>
      {/* Filter bar */}
      <div style={s.filterBar}>
        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} style={s.select}>
          <option value="">All countries</option>
          {noteCountries.map((c) => (
            <option key={c} value={c}>{flagMap[c] ?? ""} {c}</option>
          ))}
        </select>

        <select value={filterList} onChange={(e) => setFilterList(e.target.value)} style={s.select}>
          <option value="">All lists</option>
          {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <button onClick={() => setModal("new")} style={s.newBtn}>+ New note</button>
      </div>

      {/* Content */}
      <div style={s.inner}>
        {loading && <p style={s.hint}>Loading…</p>}

        {!loading && notes.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>No notes yet</div>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
              Start collecting tips, ideas, and things to check out.
            </div>
            <button onClick={() => setModal("new")} style={s.newBtn}>+ New note</button>
          </div>
        )}

        {!loading && notes.length > 0 && filtered.length === 0 && (
          <p style={s.hint}>No notes match the current filters.</p>
        )}

        {grouped.map(([country, countryNotes]) => (
          <div key={country || "__none__"} style={s.group}>
            <div style={s.groupHeader}>
              {country ? (
                <>
                  <span style={{ fontSize: 20 }}>{flagMap[country] ?? "🌍"}</span>
                  <span style={s.groupName}>{country}</span>
                  <span style={s.groupCount}>{countryNotes.length}</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <span style={s.groupName}>Uncategorised</span>
                  <span style={s.groupCount}>{countryNotes.length}</span>
                </>
              )}
            </div>

            <div style={s.grid}>
              {countryNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  lists={lists}
                  onEdit={() => setModal(note)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <NoteModal
          note={modal === "new" ? null : modal}
          lists={lists}
          onSave={handleSave}
          onDelete={modal !== "new" ? handleDelete : null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────

function NoteCard({ note, lists, onEdit }) {
  const listName = lists.find((l) => l.id === note.list_id)?.name;
  const mapsUrl  = note.city || note.country
    ? `https://www.google.com/maps/search/${encodeURIComponent([note.city, note.country].filter(Boolean).join(", "))}`
    : null;

  const dateStr = new Date(note.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        {note.city && <span style={s.city}>{note.city}</span>}
        {listName && (
          <span style={s.listChip}>{listName}</span>
        )}
      </div>

      <div style={s.noteTitle}>{note.title}</div>

      {note.body && (
        <div style={s.noteBody}>{note.body}</div>
      )}

      <div style={s.cardFooter}>
        <span style={s.dateStr}>{dateStr}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={s.mapsLink}>
              📍 Maps
            </a>
          )}
          <button onClick={onEdit} style={s.editBtn}>Edit</button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root:  { background: "#f8fafc", minHeight: "calc(100vh - 52px)" },
  filterBar: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px 24px",
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  select: {
    fontSize: 13, padding: "6px 10px", borderRadius: 8,
    border: "1px solid #d1d5db", background: "#fff", cursor: "pointer",
  },
  newBtn: {
    marginLeft: "auto", padding: "7px 16px", borderRadius: 8,
    border: "none", background: "#4f46e5", color: "#fff",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  inner: { maxWidth: 1100, margin: "0 auto", padding: "24px" },
  hint:  { fontSize: 13, color: "#94a3b8", padding: "20px 0" },
  empty: { textAlign: "center", padding: "60px 0", color: "#475569" },

  group: { marginBottom: 28 },
  groupHeader: {
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 12, paddingBottom: 8,
    borderBottom: "1px solid #e2e8f0",
  },
  groupName:  { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  groupCount: { fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "1px 7px", borderRadius: 10 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
  },
  card: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8,
  },
  cardHeader: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  city:     { fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 },
  listChip: { fontSize: 11, color: "#4f46e5", background: "#ede9fe", padding: "2px 8px", borderRadius: 4, fontWeight: 500 },
  noteTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 },
  noteBody:  { fontSize: 13, color: "#475569", lineHeight: 1.6,
    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  dateStr:   { fontSize: 11, color: "#94a3b8" },
  mapsLink:  { fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 500 },
  editBtn:   { background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#4f46e5", fontWeight: 500, padding: 0 },
};
