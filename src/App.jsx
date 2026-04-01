import { useState } from "react";
import { FlightSearch } from "./components/FlightSearch";

// ── Destination data ──────────────────────────────────────────────────────────

const REGIONS = {
  "Southeast Asia": [
    { name: "Thailand",    flag: "🇹🇭", tag: "Beaches & temples" },
    { name: "Vietnam",     flag: "🇻🇳", tag: "Street food & history" },
    { name: "Indonesia",   flag: "🇮🇩", tag: "Islands & jungle" },
    { name: "Malaysia",    flag: "🇲🇾", tag: "Modern & affordable" },
    { name: "Philippines", flag: "🇵🇭", tag: "Islands & diving" },
    { name: "Singapore",   flag: "🇸🇬", tag: "City-state hub" },
    { name: "Cambodia",    flag: "🇰🇭", tag: "Ancient ruins" },
    { name: "Myanmar",     flag: "🇲🇲", tag: "Off the beaten path" },
    { name: "Laos",        flag: "🇱🇦", tag: "Slow travel" },
  ],
  "East & South Asia": [
    { name: "Japan",        flag: "🇯🇵", tag: "Culture & tech" },
    { name: "South Korea",  flag: "🇰🇷", tag: "Food & nightlife" },
    { name: "Taiwan",       flag: "🇹🇼", tag: "Food & mountains" },
    { name: "India",        flag: "🇮🇳", tag: "Diversity & color" },
    { name: "Nepal",        flag: "🇳🇵", tag: "Himalayas & trekking" },
    { name: "Sri Lanka",    flag: "🇱🇰", tag: "Tea & beaches" },
  ],
  "Central Asia & Caucasus": [
    { name: "Georgia",     flag: "🇬🇪", tag: "Wine & mountains" },
    { name: "Armenia",     flag: "🇦🇲", tag: "Ancient monasteries" },
    { name: "Azerbaijan",  flag: "🇦🇿", tag: "Oil city meets nature" },
    { name: "Uzbekistan",  flag: "🇺🇿", tag: "Silk Road cities" },
    { name: "Kyrgyzstan",  flag: "🇰🇬", tag: "Nomadic landscapes" },
    { name: "Kazakhstan",  flag: "🇰🇿", tag: "Vast steppe & cities" },
  ],
  "Middle East": [
    { name: "UAE",    flag: "🇦🇪", tag: "Desert & skyscrapers" },
    { name: "Turkey", flag: "🇹🇷", tag: "East meets West" },
    { name: "Jordan", flag: "🇯🇴", tag: "Petra & the desert" },
    { name: "Oman",   flag: "🇴🇲", tag: "Rugged & welcoming" },
    { name: "Qatar",  flag: "🇶🇦", tag: "Modern Gulf hub" },
    { name: "Israel", flag: "🇮🇱", tag: "History & beaches" },
  ],
  "Europe": [
    { name: "Portugal",             flag: "🇵🇹", tag: "Surf & pastel de nata" },
    { name: "Spain",                flag: "🇪🇸", tag: "Sun & siesta" },
    { name: "Italy",                flag: "🇮🇹", tag: "Art & pasta" },
    { name: "Greece",               flag: "🇬🇷", tag: "Islands & ruins" },
    { name: "Croatia",              flag: "🇭🇷", tag: "Adriatic coast" },
    { name: "Montenegro",           flag: "🇲🇪", tag: "Dramatic scenery" },
    { name: "Albania",              flag: "🇦🇱", tag: "Undiscovered gem" },
    { name: "Serbia",               flag: "🇷🇸", tag: "Nightlife & culture" },
    { name: "Bulgaria",             flag: "🇧🇬", tag: "Mountains & history" },
    { name: "Romania",              flag: "🇷🇴", tag: "Castles & Carpathians" },
    { name: "Hungary",              flag: "🇭🇺", tag: "Thermal baths & ruin bars" },
    { name: "Poland",               flag: "🇵🇱", tag: "History & low cost" },
    { name: "Czech Republic",       flag: "🇨🇿", tag: "Prague & beer" },
    { name: "Estonia",              flag: "🇪🇪", tag: "Digital nomad capital" },
    { name: "Latvia",               flag: "🇱🇻", tag: "Art Nouveau & forests" },
    { name: "Lithuania",            flag: "🇱🇹", tag: "Baroque old towns" },
    { name: "Slovenia",             flag: "🇸🇮", tag: "Alps & lakes" },
    { name: "Malta",                flag: "🇲🇹", tag: "Sun & history" },
    { name: "Cyprus",               flag: "🇨🇾", tag: "Year-round warmth" },
    { name: "Iceland",              flag: "🇮🇸", tag: "Northern lights" },
  ],
  "Africa": [
    { name: "Morocco",      flag: "🇲🇦", tag: "Medinas & desert" },
    { name: "Egypt",        flag: "🇪🇬", tag: "Pyramids & Red Sea" },
    { name: "Tunisia",      flag: "🇹🇳", tag: "Roman ruins & beaches" },
    { name: "Kenya",        flag: "🇰🇪", tag: "Safari & Nairobi tech" },
    { name: "Tanzania",     flag: "🇹🇿", tag: "Kilimanjaro & Zanzibar" },
    { name: "Rwanda",       flag: "🇷🇼", tag: "Gorillas & greenery" },
    { name: "South Africa", flag: "🇿🇦", tag: "Cape Town & game parks" },
    { name: "Mauritius",    flag: "🇲🇺", tag: "Tropical paradise" },
    { name: "Cape Verde",   flag: "🇨🇻", tag: "Volcanic islands" },
    { name: "Ethiopia",     flag: "🇪🇹", tag: "Ancient civilization" },
  ],
  "Americas": [
    { name: "Mexico",             flag: "🇲🇽", tag: "Culture & cenotes" },
    { name: "Colombia",           flag: "🇨🇴", tag: "Coffee & coast" },
    { name: "Peru",               flag: "🇵🇪", tag: "Inca trails" },
    { name: "Ecuador",            flag: "🇪🇨", tag: "Galápagos & volcanoes" },
    { name: "Argentina",          flag: "🇦🇷", tag: "Patagonia & tango" },
    { name: "Chile",              flag: "🇨🇱", tag: "Desert to glaciers" },
    { name: "Brazil",             flag: "🇧🇷", tag: "Amazon & carnival" },
    { name: "Costa Rica",         flag: "🇨🇷", tag: "Pura vida" },
    { name: "Panama",             flag: "🇵🇦", tag: "Canal & islands" },
    { name: "Dominican Republic", flag: "🇩🇴", tag: "Caribbean beaches" },
    { name: "Cuba",               flag: "🇨🇺", tag: "Time-capsule culture" },
    { name: "Uruguay",            flag: "🇺🇾", tag: "Calm & cultured" },
  ],
  "Oceania": [
    { name: "Australia",  flag: "🇦🇺", tag: "Outback & Great Barrier Reef" },
    { name: "New Zealand", flag: "🇳🇿", tag: "Lord of the Rings landscapes" },
  ],
};

const ALL_REGION_NAMES = ["All", ...Object.keys(REGIONS)];

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeRegion, setActiveRegion] = useState("All");
  const [selected, setSelected]         = useState(null); // { name, flag, tag }

  const visibleCountries =
    activeRegion === "All"
      ? Object.values(REGIONS).flat()
      : REGIONS[activeRegion] ?? [];

  return (
    <div style={s.root}>
      <Header />

      {selected ? (
        <DetailView
          country={selected}
          onBack={() => setSelected(null)}
        />
      ) : (
        <>
          <RegionNav active={activeRegion} onChange={setActiveRegion} />
          <CountryGrid countries={visibleCountries} onSelect={setSelected} />
        </>
      )}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header style={s.header}>
      <div style={s.headerInner}>
        <div>
          <div style={s.logo}>Ethical Nomad</div>
          <div style={s.tagline}>Find your next base</div>
        </div>
      </div>
    </header>
  );
}

// ── Region nav ────────────────────────────────────────────────────────────────

function RegionNav({ active, onChange }) {
  return (
    <div style={s.navWrapper}>
      <div style={s.nav}>
        {ALL_REGION_NAMES.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            style={{ ...s.navBtn, ...(active === r ? s.navBtnActive : {}) }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Country grid ──────────────────────────────────────────────────────────────

function CountryGrid({ countries, onSelect }) {
  return (
    <main style={s.grid}>
      {countries.map((c) => (
        <button key={c.name} style={s.card} onClick={() => onSelect(c)}>
          <span style={s.flag}>{c.flag}</span>
          <span style={s.countryName}>{c.name}</span>
          <span style={s.countryTag}>{c.tag}</span>
        </button>
      ))}
    </main>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────

function DetailView({ country, onBack }) {
  return (
    <main style={s.detail}>
      <button onClick={onBack} style={s.backBtn}>
        ← Back to destinations
      </button>

      <div style={s.detailHeader}>
        <span style={s.detailFlag}>{country.flag}</span>
        <div>
          <h1 style={s.detailName}>{country.name}</h1>
          <p style={s.detailTag}>{country.tag}</p>
        </div>
      </div>

      <FlightSearch countryName={country.name} defaultCurr="EUR" />
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root: {
    minHeight: "100vh",
    background: "#f1f5f9",
  },

  // Header
  header: {
    background: "#0f172a",
    borderBottom: "1px solid #1e293b",
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "-0.3px",
  },
  tagline: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  // Region nav
  navWrapper: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    overflowX: "auto",
  },
  nav: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    gap: 4,
  },
  navBtn: {
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#64748b",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "color 0.15s",
  },
  navBtnActive: {
    color: "#2563eb",
    borderBottomColor: "#2563eb",
  },

  // Country grid
  grid: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
  },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center",
  },
  flag: {
    fontSize: 36,
    lineHeight: 1,
  },
  countryName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
  },
  countryTag: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 1.3,
  },

  // Detail view
  detail: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "24px",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    padding: 0,
    marginBottom: 20,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    background: "#fff",
    borderRadius: 12,
    padding: "20px 24px",
    border: "1px solid #e2e8f0",
  },
  detailFlag: {
    fontSize: 52,
    lineHeight: 1,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
  },
  detailTag: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
};
