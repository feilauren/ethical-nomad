/**
 * Vercel Serverless Function: /api/flights
 *
 * Proxies flight search requests to Sky-Scrapper (RapidAPI / Skyscanner),
 * keeping the API key server-side.
 *
 * Query params accepted:
 *   fly_from   - comma-separated IATA codes, e.g. "DUS,CGN,AMS"
 *   fly_to     - "country:XX" (ISO-2) or plain IATA code, e.g. "BKK"
 *   date_from  - DD/MM/YYYY  (start of departure window; Sky-Scrapper uses first date)
 *   date_to    - DD/MM/YYYY  (end of departure window — used for multi-date parallel search)
 *   curr       - ISO 4217 currency code, default "CAD"
 *   limit      - max results to return, default 3
 */

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

// Module-level cache for airport/entity lookups.
// Survives across requests within the same Vercel function instance.
const entityCache = new Map();

async function lookupEntity(query, isCountry, apiKey) {
  const cacheKey = query.toLowerCase();
  if (entityCache.has(cacheKey)) return entityCache.get(cacheKey);

  const url = `${RAPIDAPI_BASE}/api/v1/flights/searchAirport?query=${encodeURIComponent(query)}&locale=en-US`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    throw new Error(`Airport lookup failed for "${query}": HTTP ${res.status}`);
  }

  const data = await res.json();
  const results = (data.data || []);
  if (!results.length) {
    throw new Error(`No entity found for: ${query}`);
  }

  // For country searches prefer a COUNTRY entity; fall back to first result.
  const entity = isCountry
    ? (results.find((r) => r.navigation?.entityType === "COUNTRY") || results[0])
    : results[0];

  const result = { skyId: entity.skyId, entityId: entity.entityId };
  entityCache.set(cacheKey, result);
  return result;
}

// Convert DD/MM/YYYY → YYYY-MM-DD
function toIsoDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

async function searchOneWay(origin, destination, date, currency, apiKey) {
  const params = new URLSearchParams({
    originSkyId: origin.skyId,
    destinationSkyId: destination.skyId,
    originEntityId: origin.entityId,
    destinationEntityId: destination.entityId,
    date,
    cabinClass: "economy",
    adults: "1",
    sortBy: "cheapest",
    currency,
    market: "en-US",
    countryCode: "US",
  });

  const res = await fetch(
    `${RAPIDAPI_BASE}/api/v1/flights/searchOneWay?${params}`,
    {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Flight search failed: HTTP ${res.status} — ${body}`);
  }

  return res.json();
}

function shapeItinerary(itinerary, currency) {
  const leg = itinerary.legs?.[0];
  if (!leg) return null;

  const marketing = leg.carriers?.marketing ?? [];
  const airline = marketing[0]?.name ?? "Unknown";
  const airlines = [...new Set(marketing.map((c) => c.name))];

  // Build a Skyscanner deep-link
  const date = leg.departure?.slice(0, 10).replace(/-/g, "");
  const deepLink = `https://www.skyscanner.com/transport/flights/${leg.origin?.displayCode}/${leg.destination?.displayCode}/${date}/?adults=1`;

  return {
    id: itinerary.id,
    price: itinerary.price?.raw ?? 0,
    currency,
    airline,
    airlines,
    departure: {
      airport: leg.origin?.displayCode ?? leg.origin?.id,
      city: leg.origin?.name,
      time: leg.departure,
    },
    arrival: {
      airport: leg.destination?.displayCode ?? leg.destination?.id,
      city: leg.destination?.name,
      time: leg.arrival,
    },
    duration_minutes: leg.durationInMinutes ?? 0,
    stops: leg.stopCount ?? 0,
    deep_link: deepLink,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error("RAPIDAPI_KEY is not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const { fly_from, fly_to, date_from, date_to, curr = "CAD", limit = "3" } = req.query;

  if (!fly_from || !fly_to || !date_from || !date_to) {
    return res.status(400).json({
      error: "Missing required params: fly_from, fly_to, date_from, date_to",
    });
  }

  const dateRe = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRe.test(date_from) || !dateRe.test(date_to)) {
    return res.status(400).json({ error: "Dates must be in DD/MM/YYYY format" });
  }

  const resultLimit = Math.min(Math.max(parseInt(limit, 10) || 3, 1), 10);

  // Parse destination — "country:TH" or plain IATA like "BKK"
  const isCountry = fly_to.startsWith("country:");
  const destQuery = isCountry ? fly_to.slice(8) : fly_to; // strip "country:" prefix

  // Parse origins
  const origins = fly_from.split(",").map((s) => s.trim()).filter(Boolean);

  const searchDate = toIsoDate(date_from);

  try {
    // Resolve all entity IDs in parallel
    const [destEntity, ...originEntities] = await Promise.all([
      lookupEntity(destQuery, isCountry, apiKey),
      ...origins.map((iata) => lookupEntity(iata, false, apiKey)),
    ]);

    // Search flights from each origin in parallel
    const searchResults = await Promise.all(
      originEntities.map((orig) =>
        searchOneWay(orig, destEntity, searchDate, curr, apiKey).catch((err) => {
          console.warn(`Search from ${orig.skyId} failed:`, err.message);
          return null;
        })
      )
    );

    // Flatten, shape, sort by price, dedup by id
    const seen = new Set();
    const flights = searchResults
      .flatMap((result) => (result?.data?.itineraries ?? []))
      .map((it) => shapeItinerary(it, curr))
      .filter(Boolean)
      .filter((f) => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, resultLimit);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ flights, currency: curr });
  } catch (err) {
    console.error("Flight proxy error:", err.message);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
