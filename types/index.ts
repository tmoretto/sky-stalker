export interface Aircraft {
  hex: string; // ICAO 24-bit address
  callsign: string | null;
  registration: string | null;
  aircraftType: string | null;
  airline: string | null;
  countryCode: string | null; // ISO 3166-1 alpha-2 (derived from ICAO hex block)
  lat: number;
  lon: number;
  altitude: number | null; // feet
  groundSpeed: number | null; // knots
  heading: number | null; // degrees true
  verticalRate: number | null; // ft/min
  squawk: string | null;
  emergency: boolean;
  onGround: boolean;
  lastSeen: number; // unix timestamp
  origin: string | null;      // IATA airport code e.g. "LIS"
  destination: string | null; // IATA airport code e.g. "LHR"
}

export interface NearbyAircraftResponse {
  aircraft: Aircraft[];
  fetchedAt: number;
  source: 'airplanes.live' | 'opensky';
}

export interface SkyNotification {
  title: string;
  body: string;
  icon: string;
  data: {
    hex: string;
    lat: number;
    lon: number;
    flight: string;
    altitude: number;
    aircraft_type: string;
  };
}
