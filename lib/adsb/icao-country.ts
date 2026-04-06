/**
 * Maps an ICAO 24-bit hex address to an ISO 3166-1 alpha-2 country code
 * based on the official ICAO address allocation blocks (Doc 8643 / Annex 10).
 *
 * Converts the country code to a flag emoji for display.
 */

// [startHex, endHex, countryCodeISO]
const ICAO_RANGES: [number, number, string][] = [
  // Africa
  [0x009000, 0x00ffff, 'ZA'], // South Africa
  [0x010000, 0x017fff, 'EG'], // Egypt
  [0x018000, 0x01ffff, 'LY'], // Libya
  [0x020000, 0x027fff, 'MA'], // Morocco
  [0x028000, 0x02ffff, 'TN'], // Tunisia
  [0x030000, 0x0303ff, 'BW'], // Botswana
  [0x034000, 0x034fff, 'BI'], // Burundi
  [0x035000, 0x035fff, 'CM'], // Cameroon
  [0x038000, 0x038fff, 'CD'], // Congo (DRC)
  [0x03e000, 0x03efff, 'ET'], // Ethiopia
  [0x040000, 0x040fff, 'GQ'], // Equatorial Guinea
  [0x042000, 0x042fff, 'GH'], // Ghana
  [0x044000, 0x044fff, 'KE'], // Kenya
  [0x048000, 0x048fff, 'NG'], // Nigeria
  [0x050000, 0x050fff, 'UG'], // Uganda
  [0x054000, 0x054fff, 'TZ'], // Tanzania

  // Asia-Pacific
  [0x600000, 0x6003ff, 'AF'], // Afghanistan
  [0x608000, 0x60ffff, 'BD'], // Bangladesh
  [0x618000, 0x61ffff, 'MM'], // Myanmar
  [0x620000, 0x6203ff, 'KH'], // Cambodia
  [0x680000, 0x6803ff, 'LA'], // Laos
  [0x681000, 0x6813ff, 'NP'], // Nepal
  [0x682000, 0x6823ff, 'LK'], // Sri Lanka
  [0x700000, 0x700fff, 'PK'], // Pakistan
  [0x710000, 0x717fff, 'IQ'], // Iraq
  [0x718000, 0x71ffff, 'IR'], // Iran
  [0x720000, 0x727fff, 'IL'], // Israel
  [0x728000, 0x72ffff, 'JO'], // Jordan
  [0x730000, 0x737fff, 'LB'], // Lebanon
  [0x738000, 0x73ffff, 'MY'], // Malaysia
  [0x740000, 0x747fff, 'PH'], // Philippines
  [0x748000, 0x74ffff, 'QA'], // Qatar
  [0x750000, 0x757fff, 'SA'], // Saudi Arabia
  [0x758000, 0x75ffff, 'SG'], // Singapore
  [0x760000, 0x767fff, 'KR'], // South Korea
  [0x768000, 0x76ffff, 'TH'], // Thailand
  [0x770000, 0x777fff, 'AE'], // UAE
  [0x778000, 0x77ffff, 'VN'], // Vietnam
  [0x780000, 0x7bffff, 'CN'], // China
  [0x7c0000, 0x7fffff, 'AU'], // Australia
  [0x800000, 0x83ffff, 'IN'], // India
  [0x840000, 0x87ffff, 'JP'], // Japan
  [0x880000, 0x887fff, 'KR'], // South Korea (additional block)
  [0x888000, 0x88ffff, 'ID'], // Indonesia
  [0x890000, 0x890fff, 'TW'], // Taiwan
  [0x894000, 0x894fff, 'TW'], // Taiwan (additional)
  [0x895000, 0x8953ff, 'HK'], // Hong Kong
  [0x899000, 0x8993ff, 'MO'], // Macau

  // Europe
  [0x300000, 0x33ffff, 'IT'], // Italy
  [0x340000, 0x37ffff, 'ES'], // Spain
  [0x380000, 0x3bffff, 'FR'], // France
  [0x3c0000, 0x3fffff, 'DE'], // Germany
  [0x400000, 0x43ffff, 'GB'], // United Kingdom
  [0x440000, 0x447fff, 'AT'], // Austria
  [0x448000, 0x44ffff, 'BE'], // Belgium
  [0x450000, 0x457fff, 'BG'], // Bulgaria
  [0x458000, 0x45ffff, 'CY'], // Cyprus
  [0x460000, 0x467fff, 'CZ'], // Czech Republic
  [0x468000, 0x46ffff, 'DK'], // Denmark
  [0x470000, 0x477fff, 'EE'], // Estonia
  [0x478000, 0x47ffff, 'FI'], // Finland
  [0x480000, 0x487fff, 'GR'], // Greece
  [0x488000, 0x48ffff, 'HU'], // Hungary
  [0x490000, 0x497fff, 'IE'], // Ireland
  [0x498000, 0x49ffff, 'IS'], // Iceland
  [0x4a0000, 0x4a7fff, 'LV'], // Latvia
  [0x4a8000, 0x4affff, 'LT'], // Lithuania
  [0x4b0000, 0x4b7fff, 'LU'], // Luxembourg
  [0x4b8000, 0x4bffff, 'MT'], // Malta
  [0x4c0000, 0x4c7fff, 'MC'], // Monaco
  [0x4c8000, 0x4cffff, 'NL'], // Netherlands
  [0x4d0000, 0x4d03ff, 'NO'], // Norway
  [0x4d2000, 0x4d3fff, 'NO'], // Norway (additional)
  [0x4d4000, 0x4d7fff, 'PL'], // Poland
  [0x4d8000, 0x4dffff, 'PT'], // Portugal
  [0x4e0000, 0x4e7fff, 'RO'], // Romania
  [0x4e8000, 0x4effff, 'SK'], // Slovakia
  [0x4f0000, 0x4f7fff, 'SI'], // Slovenia
  [0x4f8000, 0x4fffff, 'SE'], // Sweden
  [0x500000, 0x507fff, 'CH'], // Switzerland
  [0x508000, 0x50ffff, 'TR'], // Turkey
  [0x510000, 0x5103ff, 'UA'], // Ukraine
  [0x514000, 0x517fff, 'UA'], // Ukraine (additional)

  // CIS / Eastern Europe
  [0x100000, 0x1fffff, 'RU'], // Russia

  // Americas
  [0xa00000, 0xafffff, 'US'], // United States
  [0xc00000, 0xc3ffff, 'CA'], // Canada
  [0xc80000, 0xc87fff, 'NZ'], // New Zealand
  [0xe00000, 0xe3ffff, 'AR'], // Argentina
  [0xe40000, 0xe7ffff, 'BR'], // Brazil
  [0xe80000, 0xe83fff, 'CL'], // Chile
  [0xe84000, 0xe87fff, 'CO'], // Colombia
  [0xe88000, 0xe8bfff, 'CR'], // Costa Rica
  [0xe8c000, 0xe8ffff, 'CU'], // Cuba
  [0xe90000, 0xe93fff, 'MX'], // Mexico
  [0xe94000, 0xe97fff, 'PE'], // Peru
  [0xe98000, 0xe9bfff, 'VE'], // Venezuela
  [0x0b0000, 0x0b0fff, 'MX'], // Mexico (additional block)
];

/**
 * Derive ISO 3166-1 alpha-2 country code from ICAO hex address.
 */
export function icaoHexToCountry(hex: string): string | null {
  const addr = parseInt(hex, 16);
  if (isNaN(addr)) return null;

  for (const [start, end, code] of ICAO_RANGES) {
    if (addr >= start && addr <= end) return code;
  }
  return null;
}

/**
 * Convert a 2-letter country code to a flag emoji.
 * "US" → "🇺🇸", "GB" → "🇬🇧", etc.
 */
export function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}
