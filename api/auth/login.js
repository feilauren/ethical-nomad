// Mock auth — accepts any email/password.
// Replace with real credential verification before production.
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }

  const user = { email: email.toLowerCase().trim() };
  res.status(200).json({ ok: true, user });
}
