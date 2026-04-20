import { useState, useEffect } from "react";
import { countries } from "../data/countries";

const COUNTRY_OPTIONS = ["", ...countries.map((c) => c.name), "Other"];

export function NoteModal({ note, lists, onSave, onDelete, onClose }) {
  const isEdit = !!note;
  const [title,   setTitle]   = useState(note?.title   ?? "");
  const [body,    setBody]     = useState(note?.body    ?? "");
  const [country, setCountry] = useState(note?.country ?? "");
  const [city,    setCity]    = useState(note?.city    ?? "");
  const [listId,  setListId]  = useState(note?.list_id ?? "");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ title: title.trim(), body: body || null, country: country || null, city: city || null, list_id: listId || null });
    setSaving(false);
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{isEdit ? "Edit note" : "New note"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 22, padding: "0 4px", lineHeight: 1 }}>×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Title *">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's this note about?"
              style={inp}
              required
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Details, tips, observations…"
              rows={4}
              style={{ ...inp, resize: "vertical", lineHeight: 1.5 }}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Country">
              <select value={country} onChange={(e) => setCountry(e.target.value)} style={inp}>
                {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c || "— none —"}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Berat" style={inp} />
            </Field>
          </div>

          <Field label="Associate with list">
            <select value={listId} onChange={(e) => setListId(e.target.value)} style={inp}>
              <option value="">— none —</option>
              {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            {isEdit && onDelete ? (
              <button type="button" onClick={onDelete} style={{ ...btn, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                Delete
              </button>
            ) : <span />}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={onClose} style={{ ...btn, background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !title.trim()} style={{ ...btn, background: "#4f46e5", color: "#fff", opacity: (saving || !title.trim()) ? 0.6 : 1 }}>
                {saving ? "Saving…" : isEdit ? "Save changes" : "Add note"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{label}</label>
      {children}
    </div>
  );
}

const inp = {
  fontSize: 13,
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  width: "100%",
  boxSizing: "border-box",
};

const btn = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
