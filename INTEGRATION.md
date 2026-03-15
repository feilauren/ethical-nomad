# Flight Search Integration Guide

## Quick start

### 1. Get a Tequila API key
Register at [tequila.kiwi.com](https://tequila.kiwi.com/) — free tier is sufficient for development. Choose "Kiwi.com Affiliate" or "Build with Kiwi.com" partnership type.

### 2. Set environment variables
```bash
cp .env.example .env.local
# fill in TEQUILA_API_KEY
```

### 3. Deploy to Vercel
```bash
vercel deploy
# add TEQUILA_API_KEY as a Vercel environment variable in the dashboard
```

---

## Architecture

```
React Modal
  └─ <FlightSearch countryName="Thailand" />
       └─ useFlightSearch hook
            └─ GET /api/flights?fly_from=DUS,CGN&fly_to=country:TH&...
                  └─ Vercel Function (api/flights.js)
                        └─ Kiwi Tequila API (server-side, key hidden)
```

---

## Integrating into your existing artifact modal

Paste this into the country detail modal where you want flight results:

```jsx
import { FlightSearch } from "./src/components/FlightSearch";

// Inside your modal JSX, after city cards / logistics section:
<FlightSearch countryName={selectedCountry.name} defaultCurr="CAD" />
```

`countryName` must match a key in `src/utils/countryToIata.js`. Add any missing countries there — the mapping is straightforward (`"Country Name": "country:XX"`).

---

## If your artifact is a single-file Claude artifact (no bundler)

Bundle the components into the artifact by inlining the hook and utilities.
The key integration surface is just the API call:

```js
async function fetchFlights({ flyFrom, flyTo, dateFrom, dateTo }) {
  const params = new URLSearchParams({ fly_from: flyFrom, fly_to: flyTo,
    date_from: dateFrom, date_to: dateTo, curr: "CAD", limit: "3" });
  const res = await fetch(`/api/flights?${params}`);
  return res.json(); // { flights: [...] }
}
```

---

## Kiwi API notes

| Parameter | Value |
|-----------|-------|
| `fly_from` | Comma-separated IATA codes: `"DUS,CGN,AMS"` |
| `fly_to` | Country prefix: `"country:TH"` — searches all airports in Thailand |
| `date_from` / `date_to` | DD/MM/YYYY — defines the **departure window**, not fixed date |
| `sort` | `price` — cheapest first |
| `one_for_city` | `1` — deduplicate, one result per destination city |
| `flight_type` | `oneway` |
| `curr` | ISO 4217 code, e.g. `CAD`, `EUR`, `USD` |

Multi-origin works natively — Kiwi searches all supplied airports and returns
the cheapest across all of them, with `departure.airport` indicating which one.

---

## Longer-term: compliance window filter

The `/api/flights` endpoint is designed to be extended. For the Schengen-days
filter vision, add query params like `max_schengen_days_used` and filter
`countryToIata.js` by Schengen status before passing `fly_to` to the API.
The existing country table already has `schengen` status — wire it through.
