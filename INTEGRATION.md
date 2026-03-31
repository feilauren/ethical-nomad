# Flight Search Integration Guide

## Architecture

```
React Modal
  └─ <FlightSearch countryName="Thailand" />
       └─ useFlightSearch hook
            └─ GET /api/flights?fly_from=DUS,CGN&fly_to=country:TH&...
                  └─ Vercel Function (api/flights.js)
                        └─ Sky-Scrapper API via RapidAPI (key hidden server-side)
```

---

## Quick start

### 1. Get a RapidAPI key
Sign up at [rapidapi.com](https://rapidapi.com) and subscribe to [Sky-Scrapper](https://rapidapi.com/apiheya/api/sky-scrapper) (free tier: 100 req/month).

### 2. Seed airport entity IDs (one-time, costs ~19 API calls)
```bash
RAPIDAPI_KEY=your_key node scripts/seed-airports.js
```
This writes `api/airport-entities.json` so every user search costs exactly 1 API call.

### 3. Set environment variables
```bash
cp .env.example .env
# fill in RAPIDAPI_KEY
```

### 4. Deploy to Vercel
```bash
vercel deploy
# add RAPIDAPI_KEY and ALLOWED_ORIGIN in the Vercel dashboard
```

---

## Integrating into your existing artifact modal

```jsx
import { FlightSearch } from "./src/components/FlightSearch";

// Inside your modal JSX, after city cards / logistics section:
<FlightSearch countryName={selectedCountry.name} defaultCurr="CAD" />
```

`countryName` must match a key in `src/utils/countryToIata.js`. Add any missing countries there — the mapping is straightforward (`"Country Name": "country:XX"`).

---

## API reference

| Parameter | Value |
|-----------|-------|
| `fly_from` | 1–5 comma-separated IATA codes: `"DUS,CGN,AMS"` |
| `fly_to` | Country prefix: `"country:TH"` or specific airport: `"BKK"` |
| `date_from` / `date_to` | DD/MM/YYYY — defines the **departure window**, not a fixed date |
| `curr` | ISO 4217 code, e.g. `CAD`, `EUR`, `USD` |
| `limit` | Number of results (1–10, default 3) |

Multi-origin: pass multiple IATA codes in `fly_from` — results are merged and sorted by price.

---

## Longer-term: compliance window filter

The `/api/flights` endpoint is designed to be extended. For the Schengen-days
filter vision, add query params like `max_schengen_days_used` and filter
`countryToIata.js` by Schengen status before passing `fly_to` to the API.
The existing country table already has `schengen` status — wire it through.
