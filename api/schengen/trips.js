import { neon } from "@neondatabase/serverless";

function getSession(req) {
  try {
    const raw = req.headers["x-session"];
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.email ? s : null;
  } catch {
    return null;
  }
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Session");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const sql = neon(process.env.DATABASE_URL);
  const email = session.email;

  try {
    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, entry_date, exit_date, label, created_at
        FROM schengen_trips
        WHERE user_email = ${email}
        ORDER BY entry_date DESC
      `;
      return res.status(200).json({ trips: rows });
    }

    if (req.method === "POST") {
      const { entry_date, exit_date, label } = req.body ?? {};
      if (!entry_date) return res.status(400).json({ error: "entry_date required" });
      const [row] = await sql`
        INSERT INTO schengen_trips (user_email, entry_date, exit_date, label)
        VALUES (${email}, ${entry_date}, ${exit_date ?? null}, ${label ?? null})
        RETURNING id, entry_date, exit_date, label, created_at
      `;
      return res.status(201).json({ trip: row });
    }

    if (req.method === "PUT") {
      const { id, entry_date, exit_date, label } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id required" });
      const [row] = await sql`
        UPDATE schengen_trips
        SET entry_date = ${entry_date}, exit_date = ${exit_date ?? null}, label = ${label ?? null}
        WHERE id = ${id} AND user_email = ${email}
        RETURNING id, entry_date, exit_date, label, created_at
      `;
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ trip: row });
    }

    if (req.method === "DELETE") {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id required" });
      await sql`DELETE FROM schengen_trips WHERE id = ${id} AND user_email = ${email}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("schengen/trips error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
