import { useState, useEffect } from "react";

const SESSION_KEY = "en-session";

export function LoginGate({ session, onLogin, onSignOut, children }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  // On mount: attempt to restore session from localStorage
  useEffect(() => {
    if (session) return;
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) onLogin(parsed);
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (session) return children;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.backdrop}>
      <div style={s.card}>
        <div style={s.logo}>ethical nomad</div>
        <p style={s.sub}>Sign in to continue</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={s.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={s.input}
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={s.hint}>Any email and password works (mock auth).</p>
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    minHeight: "100vh",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "36px 40px",
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  logo: {
    fontWeight: 800,
    fontSize: 22,
    color: "#4f46e5",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 24,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  error: {
    fontSize: 12,
    color: "#dc2626",
    margin: 0,
  },
  btn: {
    padding: "10px 0",
    borderRadius: 8,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
  hint: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 20,
    marginBottom: 0,
  },
};
