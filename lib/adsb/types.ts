// Raw response shapes from external ADS-B APIs — never leak beyond transform.ts

export interface AirplanesLiveAircraft {
  hex: string;
  flight?: string; // callsign with trailing spaces
  r?: string; // registration
  t?: string; // aircraft type (e.g. "B738")
  lat?: number;
  lon?: number;
  alt_baro?: number | 'ground';
  alt_geom?: number;
  gs?: number; // ground speed knots
  track?: number; // heading degrees
  baro_rate?: number; // vertical rate ft/min
  squawk?: string;
  emergency?: string; // "none" | "general" | "lifeguard" | "minfuel" | "nordo" | "unlawful" | "downed"
  seen?: number; // seconds since last message
  seen_pos?: number;
  from_iata?: string; // origin airport IATA code
  to_iata?: string;   // destination airport IATA code
  from_icao?: string;
  to_icao?: string;
}

export interface AirplanesLiveResponse {
  ac: AirplanesLiveAircraft[];
  msg: string;
  now: number;
  total: number;
}

// OpenSky state vector: array positions matter
// [icao24, callsign, origin_country, time_position, last_contact,
//  longitude, latitude, baro_altitude, on_ground, velocity,
//  true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source]
export type OpenSkyStateVector = [
  string, // 0 icao24
  string | null, // 1 callsign
  string, // 2 origin_country
  number | null, // 3 time_position
  number, // 4 last_contact
  number | null, // 5 longitude
  number | null, // 6 latitude
  number | null, // 7 baro_altitude (meters)
  boolean, // 8 on_ground
  number | null, // 9 velocity (m/s)
  number | null, // 10 true_track
  number | null, // 11 vertical_rate (m/s)
  number[] | null, // 12 sensors
  number | null, // 13 geo_altitude (meters)
  string | null, // 14 squawk
  boolean, // 15 spi
  number, // 16 position_source
];

export interface OpenSkyResponse {
  time: number;
  states: OpenSkyStateVector[] | null;
}
