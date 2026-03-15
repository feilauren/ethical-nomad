/**
 * Vercel Serverless Function: /api/flights
 *
 * Proxies flight search requests to the Kiwi Tequila API,
 * keeping the API key server-side.
 *
 * Query params accepted:
 *   fly_from   - comma-separated IATA codes, e.g. "DUS,CGN,AMS"
 *   fly_to     - country code prefixed, e.g. "country:TH" or airport "BKK"
 *   date_from  - DD/MM/YYYY  (departure window start)
 *   date_to    - DD/MM/YYYY  (departure window end)
 *   curr       - ISO 4217 currency code, default "CAD"
 *   limit      - max results to return, default 3
 */

const TEQUILA_BASE = "https://tequila-api.kiwi.com";

export default async function handler(req, res) {
  // CORS — tighten origin in production
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TEQUILA_API_KEY;
  if (!apiKey) {
    console.error("TEQUILA_API_KEY is not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const {
    fly_from,
    fly_to,
    date_from,
    date_to,
    curr = "CAD",
    limit = "3",
  } = req.query;

  // Basic input validation
  if (!fly_from || !fly_to || !date_from || !date_to) {
    return res.status(400).json({
      error: "Missing required params: fly_from, fly_to, date_from, date_to",
    });
  }

  // Validate date format DD/MM/YYYY
  const dateRe = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRe.test(date_from) || !dateRe.test(date_to)) {
    return res.status(400).json({ error: "Dates must be in DD/MM/YYYY format" });
  }

  // Clamp limit to prevent abuse
  const resultLimit = Math.min(Math.max(parseInt(limit, 10) || 3, 1), 10);

  const params = new URLSearchParams({
    fly_from,
    fly_to,
    date_from,
    date_to,
    flight_type: "oneway",
    sort: "price",
    limit: String(resultLimit),
    curr,
    one_for_city: "1",   // best price per destination city
    partner_market: "us",
  });

  const url = `${TEQUILA_BASE}/v2/search?${params}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error(`Tequila API error ${upstream.status}:`, body);
      return res.status(upstream.status).json({
        error: "Upstream flight API error",
        detail: upstream.status === 403 ? "Invalid or missing API key" : body,
      });
    }

    const data = await upstream.json();

    // Shape the response — only send what the UI needs
    const flights = (data.data || []).slice(0, resultLimit).map((f) => ({
      id: f.id,
      price: f.price,
      currency: curr,
      airline: f.airlines?.[0] ?? "Unknown",
      airlines: f.airlines ?? [],
      departure: {
        airport: f.flyFrom,
        city: f.cityFrom,
        time: f.local_departure,
      },
      arrival: {
        airport: f.flyTo,
        city: f.cityTo,
        time: f.local_arrival,
      },
      duration_minutes: Math.round((f.duration?.departure ?? 0) / 60),
      stops: (f.route?.length ?? 1) - 1,
      deep_link: f.deep_link,
    }));

    return res.status(200).json({ flights, currency: curr });
  } catch (err) {
    console.error("Flight proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
