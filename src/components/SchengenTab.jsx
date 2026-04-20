import { useState } from "react";
import {
  daysUsed, daysRemaining, validateTrip, earliestEntry, fmtDate, tripDays,
} from "../utils/schengenCalc";

export function SchengenTab({ schengenApi }) {
  const { trips, loading, addTrip, updateTrip, deleteTrip } = schengenApi;

  const used      = daysUsed(trips);
  const remaining = daysRemaining(trips);
  const statusCol = remaining > 20 ? "#16a34a" : remaining > 0 ? "#d97706" : "#dc2626";

  // Window dates
  const today     = new Date();
  const winStart  = new Date(today); winStart.setDate(winStart.getDate() - 179);
  const winLabel  = `${fmtDate(winStart.toISOString().slice(0, 10))} – ${fmtDate(today.toISOString().slice(0, 10))}`;

  return (
    <div style={s.root}>
      <div style={s.inner}>
        <div style={s.twoCol}>
          {/* ── Left: trip log ── */}
          <div>
            <h2 style={s.heading}>Trip log</h2>
            <AddTripForm onAdd={addTrip} />
            <TripTable trips={trips} loading={loading} onUpdate={updateTrip} onDelete={deleteTrip} />
          </div>

          {/* ── Right: calculator ── */}
          <div>
            <h2 style={s.heading}>Calculator</h2>

            {/* Main stat */}
            <div style={s.statCard}>
              <div style={s.statRow}>
                <div style={s.statBlock}>
                  <div style={{ ...s.statNum, color: statusCol }}>{used}</div>
                  <div style={s.statLabel}>days used</div>
                </div>
                <div style={s.statDivider}>/</div>
                <div style={s.statBlock}>
                  <div style={{ ...s.statNum, color: statusCol }}>{Math.max(0, remaining)}</div>
                  <div style={s.statLabel}>days remaining</div>
                </div>
              </div>
              <div style={s.windowLabel}>180-day window: {winLabel}</div>
              {remaining <= 0 && (
                <div style={s.overLimit}>⚠ You have exceeded the 90-day limit</div>
              )}
            </div>

            {/* Future trip planner */}
            <FutureTripPlanner trips={trips} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add trip form ─────────────────────────────────────────────────────────────

function AddTripForm({ onAdd }) {
  const [entry,     setEntry]     = useState("");
  const [exit,      setExit]      = useState("");
  const [label,     setLabel]     = useState("");
  const [stillHere, setStillHere] = useState(false);
  const [saving,    setSaving]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!entry) return;
    setSaving(true);
    await onAdd(entry, stillHere ? null : exit || null, label || null);
    setEntry(""); setExit(""); setLabel(""); setStillHere(false);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={s.addForm}>
      <div style={s.formRow}>
        <label style={s.fieldLabel}>Entry date</label>
        <input type="date" value={entry} onChange={(e) => setEntry(e.target.value)}
          required style={s.dateInput} max={new Date().toISOString().slice(0, 10)} />
      </div>
      <div style={s.formRow}>
        <label style={s.fieldLabel}>
          Exit date
          <label style={s.stillHereLabel}>
            <input type="checkbox" checked={stillHere} onChange={(e) => setStillHere(e.target.checked)} style={{ marginLeft: 8, marginRight: 4 }} />
            still here
          </label>
        </label>
        {!stillHere && (
          <input type="date" value={exit} onChange={(e) => setExit(e.target.value)}
            style={s.dateInput} min={entry} max={new Date().toISOString().slice(0, 10)} />
        )}
      </div>
      <div style={s.formRow}>
        <label style={s.fieldLabel}>Label (optional)</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Portugal trip" style={s.textInput} />
      </div>
      <button type="submit" disabled={saving || !entry} style={{ ...s.saveBtn, ...(saving || !entry ? s.saveBtnDisabled : {}) }}>
        {saving ? "Saving…" : "Add trip"}
      </button>
    </form>
  );
}

// ── Trip table ────────────────────────────────────────────────────────────────

function TripTable({ trips, loading, onUpdate, onDelete }) {
  const [editId, setEditId] = useState(null);

  if (loading) return <p style={s.hint}>Loading…</p>;
  if (!trips.length) return <p style={s.hint}>No trips logged yet. Add one above.</p>;

  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead>
          <tr>
            {["Entry", "Exit", "Days", "Label", ""].map((h) => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trips.map((t) =>
            editId === t.id
              ? <EditRow key={t.id} trip={t} onSave={async (patch) => { await onUpdate(t.id, patch); setEditId(null); }} onCancel={() => setEditId(null)} />
              : <ViewRow key={t.id} trip={t} onEdit={() => setEditId(t.id)} onDelete={() => onDelete(t.id)} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function ViewRow({ trip: t, onEdit, onDelete }) {
  const days = tripDays(t.entry_date, t.exit_date);
  return (
    <tr style={s.tr}>
      <td style={s.td}>{fmtDate(t.entry_date)}</td>
      <td style={s.td}>{t.exit_date ? fmtDate(t.exit_date) : <span style={{ color: "#6366f1", fontSize: 11, fontWeight: 600 }}>here</span>}</td>
      <td style={{ ...s.td, fontWeight: 600 }}>{days}</td>
      <td style={{ ...s.td, color: "#64748b", fontSize: 12 }}>{t.label || "—"}</td>
      <td style={{ ...s.td, whiteSpace: "nowrap" }}>
        <button onClick={onEdit}   style={s.rowBtn}>Edit</button>
        <button onClick={onDelete} style={{ ...s.rowBtn, color: "#dc2626" }}>Delete</button>
      </td>
    </tr>
  );
}

function EditRow({ trip: t, onSave, onCancel }) {
  const [entry,     setEntry]     = useState(t.entry_date);
  const [exit,      setExit]      = useState(t.exit_date ?? "");
  const [label,     setLabel]     = useState(t.label ?? "");
  const [stillHere, setStillHere] = useState(!t.exit_date);

  return (
    <tr style={s.tr}>
      <td style={s.td}><input type="date" value={entry} onChange={(e) => setEntry(e.target.value)} style={s.inlineInput} /></td>
      <td style={s.td}>
        {stillHere
          ? <span style={{ color: "#6366f1", fontSize: 11 }}>here</span>
          : <input type="date" value={exit} onChange={(e) => setExit(e.target.value)} style={s.inlineInput} />}
        <label style={{ fontSize: 10, marginLeft: 4, color: "#64748b" }}>
          <input type="checkbox" checked={stillHere} onChange={(e) => setStillHere(e.target.checked)} style={{ marginRight: 2 }} />here
        </label>
      </td>
      <td style={s.td}></td>
      <td style={s.td}><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label" style={s.inlineInput} /></td>
      <td style={{ ...s.td, whiteSpace: "nowrap" }}>
        <button onClick={() => onSave({ entry_date: entry, exit_date: stillHere ? null : exit || null, label: label || null })} style={s.rowBtn}>Save</button>
        <button onClick={onCancel} style={{ ...s.rowBtn, color: "#94a3b8" }}>Cancel</button>
      </td>
    </tr>
  );
}

// ── Future trip planner ───────────────────────────────────────────────────────

function FutureTripPlanner({ trips }) {
  const [entry,   setEntry]   = useState("");
  const [exit,    setExit]    = useState("");
  const [result,  setResult]  = useState(null);

  function check() {
    if (!entry || !exit) return;
    const { ok, daysWouldUse, overBy } = validateTrip(trips, entry, exit);
    const earliest = ok ? null : earliestEntry(trips, tripDays(entry, exit));
    setResult({ ok, daysWouldUse, overBy, earliest, tripLen: tripDays(entry, exit) });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div style={s.plannerCard}>
      <div style={s.plannerHeading}>Future trip planner</div>
      <div style={s.formRow}>
        <label style={s.fieldLabel}>Planned entry</label>
        <input type="date" value={entry} min={today} onChange={(e) => { setEntry(e.target.value); setResult(null); }} style={s.dateInput} />
      </div>
      <div style={s.formRow}>
        <label style={s.fieldLabel}>Planned exit</label>
        <input type="date" value={exit} min={entry || today} onChange={(e) => { setExit(e.target.value); setResult(null); }} style={s.dateInput} />
      </div>
      <button onClick={check} disabled={!entry || !exit} style={{ ...s.saveBtn, ...(!entry || !exit ? s.saveBtnDisabled : {}) }}>
        Check
      </button>

      {result && (
        <div style={{ ...s.plannerResult, background: result.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${result.ok ? "#bbf7d0" : "#fecaca"}` }}>
          {result.ok ? (
            <>
              <div style={{ color: "#16a34a", fontWeight: 700, marginBottom: 4 }}>✓ This trip is within the 90-day limit</div>
              <div style={{ fontSize: 13, color: "#475569" }}>
                Trip length: {result.tripLen} day{result.tripLen !== 1 ? "s" : ""}. Days used at end of trip: {result.daysWouldUse}/90.
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>✗ This trip exceeds the 90-day limit by {result.overBy} day{result.overBy !== 1 ? "s" : ""}</div>
              {result.earliest && (
                <div style={{ fontSize: 13, color: "#475569" }}>
                  Earliest legal entry for a {result.tripLen}-day stay:{" "}
                  <strong>{result.earliest.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root:  { background: "#f8fafc", minHeight: "calc(100vh - 52px)" },
  inner: { maxWidth: 1100, margin: "0 auto", padding: "28px 24px" },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 32,
    alignItems: "start",
  },
  heading: { fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16, margin: "0 0 16px" },

  // Stat card
  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 16,
  },
  statRow: { display: "flex", alignItems: "center", gap: 16, marginBottom: 10 },
  statBlock: { textAlign: "center" },
  statNum:  { fontSize: 48, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },
  statDivider: { fontSize: 32, color: "#cbd5e1", fontWeight: 300 },
  windowLabel: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  overLimit: {
    marginTop: 10, padding: "8px 12px", background: "#fef2f2",
    border: "1px solid #fecaca", borderRadius: 8,
    color: "#dc2626", fontSize: 13, fontWeight: 600,
  },

  // Form
  addForm: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10,
  },
  formRow: { display: "flex", flexDirection: "column", gap: 3 },
  fieldLabel: { fontSize: 11, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center" },
  stillHereLabel: { fontSize: 11, color: "#6366f1", fontWeight: 500, cursor: "pointer" },
  dateInput: { fontSize: 13, padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff" },
  textInput: { fontSize: 13, padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff" },
  saveBtn: {
    padding: "8px 16px", borderRadius: 8, border: "none",
    background: "#4f46e5", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
    alignSelf: "flex-start",
  },
  saveBtnDisabled: { background: "#94a3b8", cursor: "not-allowed" },

  // Table
  tableWrap: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "9px 12px", verticalAlign: "middle" },
  rowBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#4f46e5", padding: "0 4px", fontWeight: 500 },
  inlineInput: { fontSize: 12, padding: "3px 6px", borderRadius: 4, border: "1px solid #d1d5db", width: "100%", minWidth: 0 },

  hint: { fontSize: 13, color: "#94a3b8", padding: "12px 0" },

  // Planner
  plannerCard: {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
    padding: "16px", display: "flex", flexDirection: "column", gap: 10,
  },
  plannerHeading: { fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 4 },
  plannerResult: { borderRadius: 8, padding: "12px 14px", marginTop: 4 },
};
