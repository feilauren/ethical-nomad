import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");

  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  try {
    const sql = neon(process.env.DATABASE_URL);

    await sql`
      CREATE TABLE IF NOT EXISTS schengen_trips (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email  TEXT NOT NULL,
        entry_date  DATE NOT NULL,
        exit_date   DATE,
        label       TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_email  TEXT NOT NULL,
        title       TEXT NOT NULL,
        body        TEXT,
        country     TEXT,
        city        TEXT,
        list_id     TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_schengen_trips_user ON schengen_trips(user_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_email)`;

    return res.status(200).json({ ok: true, message: "Schema ready" });
  } catch (err) {
    console.error("DB setup error:", err);
    return res.status(500).json({ error: "Setup failed" });
  }
}
