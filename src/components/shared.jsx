export const Chip = ({ label, onRemove, color, small }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: small ? "2px 8px" : "4px 10px",
    background: color || "#ede9fe",
    color: color ? "#fff" : "#4f46e5",
    borderRadius: 20,
    fontSize: small ? 11 : 12,
    fontWeight: 500,
    whiteSpace: "nowrap",
  }}>
    {label}
    {onRemove && (
      <button onClick={onRemove} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "inherit", padding: 0, fontSize: 14, lineHeight: 1, opacity: 0.7,
      }}>×</button>
    )}
  </span>
);

export const Btn = ({ active, onClick, children, col, small, outline }) => (
  <button onClick={onClick} style={{
    padding: small ? "4px 10px" : "6px 14px",
    borderRadius: 6,
    border: outline ? "1px solid #e2e8f0" : "none",
    cursor: "pointer",
    fontSize: small ? 11 : 12,
    fontWeight: active ? 600 : 400,
    whiteSpace: "nowrap",
    background: active ? (col || "#6366f1") : "#fff",
    color: active ? "#fff" : "#475569",
    boxShadow: active ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
    transition: "all 0.15s",
  }}>
    {children}
  </button>
);

export const Section = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{
      fontSize: 10, color: "#94a3b8", textTransform: "uppercase",
      letterSpacing: 1, marginBottom: 6, fontWeight: 600,
    }}>
      {label}
    </div>
    {children}
  </div>
);
