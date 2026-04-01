/**
 * Maps country names (as used in the dashboard) to Sky-Scrapper "fly_to" values.
 *
 * Accepted formats:
 *   - "country:XX"  — ISO 3166-1 alpha-2 code, searches all airports in that country
 *   - "IATA"        — specific airport code, e.g. "BKK"
 *
 * Using "country:XX" gives the broadest match for nomad-style searches.
 */

export const COUNTRY_TO_FLY_TO = {
  // Southeast Asia
  Thailand: "country:TH",
  Vietnam: "country:VN",
  Indonesia: "country:ID",
  Malaysia: "country:MY",
  Philippines: "country:PH",
  Singapore: "country:SG",
  Cambodia: "country:KH",
  Myanmar: "country:MM",
  Laos: "country:LA",

  // East Asia
  Japan: "country:JP",
  "South Korea": "country:KR",
  Taiwan: "country:TW",
  China: "country:CN",

  // South Asia
  India: "country:IN",
  Nepal: "country:NP",
  "Sri Lanka": "country:LK",

  // Central Asia / Caucasus
  Georgia: "country:GE",
  Armenia: "country:AM",
  Azerbaijan: "country:AZ",
  Kazakhstan: "country:KZ",
  Kyrgyzstan: "country:KG",
  Uzbekistan: "country:UZ",

  // Middle East
  UAE: "country:AE",
  "United Arab Emirates": "country:AE",
  Turkey: "country:TR",
  Israel: "country:IL",
  Jordan: "country:JO",
  Oman: "country:OM",
  Qatar: "country:QA",

  // Europe (Schengen + non-Schengen)
  Albania: "country:AL",
  "Bosnia and Herzegovina": "country:BA",
  Bulgaria: "country:BG",
  Croatia: "country:HR",
  "North Macedonia": "country:MK",
  Montenegro: "country:ME",
  Serbia: "country:RS",
  Kosovo: "country:XK",
  Moldova: "country:MD",
  Ukraine: "country:UA",
  Belarus: "country:BY",
  Romania: "country:RO",
  Hungary: "country:HU",
  Poland: "country:PL",
  "Czech Republic": "country:CZ",
  Czechia: "country:CZ",
  Slovakia: "country:SK",
  Slovenia: "country:SI",
  Estonia: "country:EE",
  Latvia: "country:LV",
  Lithuania: "country:LT",
  Germany: "country:DE",
  France: "country:FR",
  Spain: "country:ES",
  Portugal: "country:PT",
  Italy: "country:IT",
  Greece: "country:GR",
  Netherlands: "country:NL",
  Belgium: "country:BE",
  Austria: "country:AT",
  Switzerland: "country:CH",
  Denmark: "country:DK",
  Sweden: "country:SE",
  Norway: "country:NO",
  Finland: "country:FI",
  Iceland: "country:IS",
  Ireland: "country:IE",
  "United Kingdom": "country:GB",
  UK: "country:GB",
  Malta: "country:MT",
  Cyprus: "country:CY",

  // Africa
  Morocco: "country:MA",
  Egypt: "country:EG",
  Tunisia: "country:TN",
  "South Africa": "country:ZA",
  Kenya: "country:KE",
  Tanzania: "country:TZ",
  Ethiopia: "country:ET",
  Rwanda: "country:RW",
  "Cape Verde": "country:CV",
  Mauritius: "country:MU",

  // Americas
  Mexico: "country:MX",
  Colombia: "country:CO",
  Peru: "country:PE",
  Ecuador: "country:EC",
  Chile: "country:CL",
  Argentina: "country:AR",
  Brazil: "country:BR",
  Uruguay: "country:UY",
  Bolivia: "country:BO",
  Paraguay: "country:PY",
  Panama: "country:PA",
  "Costa Rica": "country:CR",
  Guatemala: "country:GT",
  Honduras: "country:HN",
  Nicaragua: "country:NI",
  Cuba: "country:CU",
  "Dominican Republic": "country:DO",
  Belize: "country:BZ",

  // Oceania
  Australia: "country:AU",
  "New Zealand": "country:NZ",

  // North America
  Canada: "country:CA",
  "United States": "country:US",
  USA: "country:US",
};

/**
 * Returns the fly_to value for a given country name.
 */
export function getFlightDestination(countryName) {
  return COUNTRY_TO_FLY_TO[countryName] ?? null;
}
