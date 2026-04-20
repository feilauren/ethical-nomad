// Mock session check — reads the X-Session header set by the client.
// Replace with real JWT/cookie verification before production.
export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const header = req.headers["x-session"];
  if (!header) return res.status(401).json({ ok: false });

  try {
    const user = JSON.parse(header);
    if (!user?.email) return res.status(401).json({ ok: false });
    return res.status(200).json({ ok: true, user });
  } catch {
    return res.status(401).json({ ok: false });
  }
}
