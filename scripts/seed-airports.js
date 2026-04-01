/**
 * One-time script: resolves skyId + entityId for every airport used by
 * AirportSelector and writes them to api/airport-entities.json.
 *
 * Run once:
 *   RAPIDAPI_KEY=<your_key> node scripts/seed-airports.js
 *
 * After this, api/flights.js will load the JSON and skip all lookup calls,
 * meaning every user search costs exactly 1 RapidAPI call.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
if (!RAPIDAPI_KEY) {
  console.error("Set RAPIDAPI_KEY env var before running this script.");
  process.exit(1);
}

const HOST = "sky-scrapper.p.rapidapi.com";

// Every IATA code used in AirportSelector.jsx
const AIRPORTS = [
  "DUS", "CGN", "AMS", "FRA", "BRU",   // Düsseldorf group
  "MUC", "STR",                          // Frankfurt group extras
  "LHR", "LGW", "STN", "LTN", "BRS",   // London group
  "BCN", "GRO", "REU", "VLC",           // Barcelona group
  "LIS", "OPO", "FAO",                  // Lisbon group
];

async function lookup(iata) {
  const url = `https://${HOST}/api/v1/flights/searchAirport?query=${iata}&locale=en-US`;
  const res = await fetch(url, {
    headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": HOST },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${iata}`);
  const data = await res.json();
  const first = data.data?.[0];
  if (!first) throw new Error(`No result for ${iata}`);
  return { skyId: first.skyId, entityId: first.entityId };
}

async function main() {
  const result = {};
  for (const iata of AIRPORTS) {
    try {
      const entity = await lookup(iata);
      result[iata] = entity;
      console.log(`✓ ${iata} → skyId=${entity.skyId} entityId=${entity.entityId}`);
    } catch (err) {
      console.error(`✗ ${iata}: ${err.message}`);
    }
    // Small delay to avoid rate-limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  const outPath = join(__dirname, "../api/airport-entities.json");
  writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nWrote ${Object.keys(result).length} entries → ${outPath}`);
}

main();
