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
        SELECT id, title, body, country, city, list_id, created_at
        FROM notes
        WHERE user_email = ${email}
        ORDER BY created_at DESC
      `;
      return res.status(200).json({ notes: rows });
    }

    if (req.method === "POST") {
      const { title, body, country, city, list_id } = req.body ?? {};
      if (!title?.trim()) return res.status(400).json({ error: "title required" });
      const [row] = await sql`
        INSERT INTO notes (user_email, title, body, country, city, list_id)
        VALUES (${email}, ${title.trim()}, ${body ?? null}, ${country ?? null}, ${city ?? null}, ${list_id ?? null})
        RETURNING id, title, body, country, city, list_id, created_at
      `;
      return res.status(201).json({ note: row });
    }

    if (req.method === "PUT") {
      const { id, title, body, country, city, list_id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id required" });
      if (!title?.trim()) return res.status(400).json({ error: "title required" });
      const [row] = await sql`
        UPDATE notes
        SET title = ${title.trim()}, body = ${body ?? null},
            country = ${country ?? null}, city = ${city ?? null}, list_id = ${list_id ?? null}
        WHERE id = ${id} AND user_email = ${email}
        RETURNING id, title, body, country, city, list_id, created_at
      `;
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ note: row });
    }

    if (req.method === "DELETE") {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id required" });
      await sql`DELETE FROM notes WHERE id = ${id} AND user_email = ${email}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("notes error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
