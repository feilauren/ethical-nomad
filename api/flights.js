/**
 * Vercel Serverless Function: /api/flights
 *
 * Proxies flight search requests to Sky-Scrapper (RapidAPI / Skyscanner),
 * keeping the API key server-side.
 *
 * Query params accepted:
 *   fly_from   - comma-separated IATA codes, e.g. "DUS,CGN,AMS"
 *   fly_to     - "country:XX" (ISO-2) or plain IATA code, e.g. "BKK"
 *   date_from  - DD/MM/YYYY  (start of departure window)
 *   date_to    - DD/MM/YYYY  (end of departure window)
 *   curr       - ISO 4217 currency code, default "CAD"
 *   limit      - max results to return, default 3
 */

const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

// Allowlist of accepted currencies
const VALID_CURRENCIES = new Set([
  "CAD","USD","EUR","GBP","AUD","CHF","SEK","NOK","DKK","SGD",
  "HKD","JPY","KRW","THB","MYR","IDR","PHP","VND","INR","AED",
  "ZAR","BRL","MXN","NZD","CZK","PLN","HUF","RON","BGN","HRK",
]);

// Validation patterns
const IATA_RE = /^[A-Z]{3}$/;
const ISO2_RE = /^[A-Z]{2}$/;
const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
const DISPLAY_CODE_RE = /^[A-Z]{3}$/;

// Pre-seeded entity IDs from scripts/seed-airports.js — zero API calls for lookups.
// Falls back to dynamic lookup for any airport not in this map.
let seededEntities = {};
try {
  const { createRequire } = await import("module");
  const require = createRequire(import.meta.url);
  seededEntities = require("./airport-entities.json");
} catch {
  // File doesn't exist yet — run: RAPIDAPI_KEY=<key> node scripts/seed-airports.js
}

// Module-level cache for any airports not covered by the seeded file.
const entityCache = new Map(Object.entries(seededEntities));

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
    throw new Error("Airport lookup unavailable");
  }

  const data = await res.json();
  const results = data.data || [];
  if (!results.length) {
    throw new Error("Airport not found");
  }

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
    throw new Error("Flight search unavailable");
  }

  return res.json();
}

function shapeItinerary(itinerary, currency) {
  const leg = itinerary.legs?.[0];
  if (!leg) return null;

  const originCode = leg.origin?.displayCode ?? "";
  const destCode = leg.destination?.displayCode ?? "";
  const rawDate = leg.departure?.slice(0, 10) ?? "";

  // Validate codes and date before building the deep-link
  const safeOrigin = DISPLAY_CODE_RE.test(originCode) ? originCode : "";
  const safeDest = DISPLAY_CODE_RE.test(destCode) ? destCode : "";
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate.replace(/-/g, "")
    : "";

  const deepLink =
    safeOrigin && safeDest && safeDate
      ? `https://www.skyscanner.com/transport/flights/${safeOrigin}/${safeDest}/${safeDate}/?adults=1`
      : "https://www.skyscanner.com";

  const marketing = leg.carriers?.marketing ?? [];
  const airline = marketing[0]?.name ?? "Unknown";
  const airlines = [...new Set(marketing.map((c) => c.name))];

  return {
    id: itinerary.id,
    price: itinerary.price?.raw ?? 0,
    currency,
    airline,
    airlines,
    departure: {
      airport: safeOrigin || leg.origin?.id,
      city: leg.origin?.name,
      time: leg.departure,
    },
    arrival: {
      airport: safeDest || leg.destination?.id,
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

  // ── Input validation ────────────────────────────────────────────────────────

  if (!fly_from || !fly_to || !date_from || !date_to) {
    return res.status(400).json({
      error: "Missing required params: fly_from, fly_to, date_from, date_to",
    });
  }

  // fly_from: 1–5 comma-separated IATA codes
  const origins = fly_from.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (origins.length === 0 || origins.length > 5 || origins.some((c) => !IATA_RE.test(c))) {
    return res.status(400).json({ error: "fly_from must be 1–5 valid IATA airport codes" });
  }

  // fly_to: "country:XX" or plain IATA
  const isCountry = fly_to.startsWith("country:");
  const destQuery = isCountry ? fly_to.slice(8).toUpperCase() : fly_to.toUpperCase();
  if (isCountry ? !ISO2_RE.test(destQuery) : !IATA_RE.test(destQuery)) {
    return res.status(400).json({ error: "fly_to must be a valid IATA code or country:XX" });
  }

  // dates
  if (!DATE_RE.test(date_from) || !DATE_RE.test(date_to)) {
    return res.status(400).json({ error: "Dates must be in DD/MM/YYYY format" });
  }

  // currency
  const currency = String(curr).toUpperCase();
  if (!VALID_CURRENCIES.has(currency)) {
    return res.status(400).json({ error: "Unsupported currency code" });
  }

  const resultLimit = Math.min(Math.max(parseInt(limit, 10) || 3, 1), 10);
  const searchDate = toIsoDate(date_from);

  // ── Search ──────────────────────────────────────────────────────────────────

  try {
    const [destEntity, ...originEntities] = await Promise.all([
      lookupEntity(destQuery, isCountry, apiKey),
      ...origins.map((iata) => lookupEntity(iata, false, apiKey)),
    ]);

    const searchResults = await Promise.all(
      originEntities.map((orig) =>
        searchOneWay(orig, destEntity, searchDate, currency, apiKey).catch((err) => {
          console.warn(`Search from ${orig.skyId} failed:`, err.message);
          return null;
        })
      )
    );

    const seen = new Set();
    const flights = searchResults
      .flatMap((result) => result?.data?.itineraries ?? [])
      .map((it) => shapeItinerary(it, currency))
      .filter(Boolean)
      .filter((f) => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, resultLimit);

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ flights, currency });
  } catch (err) {
    console.error("Flight proxy error:", err.message);
    return res.status(500).json({ error: "Unable to complete flight search" });
  }
}
