const TABS = [
  ["explore",  "🌍 Explore"],
  ["flights",  "✈️ Flights"],
  ["schengen", "🗓 Schengen"],
  ["notes",    "📝 Notes"],
];

export function Header({ tab, setTab, session, onSignOut }) {
  return (
    <div style={{
      background: "#fff",
      borderBottom: "1px solid #e2e8f0",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 40,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      height: 52,
    }}>
      <div style={{ fontWeight: 800, fontSize: 17, color: "#4f46e5", letterSpacing: -0.5 }}>
        ethical nomad
      </div>

      <div style={{ display: "flex", gap: 0 }}>
        {TABS.map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "0 16px",
              height: 52,
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === id ? 700 : 400,
              color: tab === id ? "#4f46e5" : "#64748b",
              borderBottom: tab === id ? "2px solid #4f46e5" : "2px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {session && (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{session.email}</span>
        )}
        {session && (
          <button
            onClick={onSignOut}
            style={{
              fontSize: 12,
              color: "#64748b",
              background: "none",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
