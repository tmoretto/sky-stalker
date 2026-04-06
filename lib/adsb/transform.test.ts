import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformAirplanesLive, transformOpenSky } from './transform';
import type { AirplanesLiveAircraft, OpenSkyStateVector } from './types';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
});

describe('transformAirplanesLive', () => {
  const base: AirplanesLiveAircraft = {
    hex: 'A835AF',
    flight: 'UAL123  ',
    r: 'N12345',
    t: 'B738',
    lat: 40.6413,
    lon: -73.7781,
    alt_baro: 35000,
    alt_geom: 35200,
    gs: 450.5,
    track: 270.3,
    baro_rate: -500,
    squawk: '1200',
    emergency: 'none',
    seen: 2,
  };

  it('transforms a complete aircraft record', () => {
    const result = transformAirplanesLive(base);
    expect(result).not.toBeNull();
    expect(result!.hex).toBe('a835af');
    expect(result!.callsign).toBe('UAL123');
    expect(result!.registration).toBe('N12345');
    expect(result!.aircraftType).toBe('B738');
    expect(result!.airline).toBe('UAL');
    expect(result!.lat).toBe(40.6413);
    expect(result!.lon).toBe(-73.7781);
    expect(result!.altitude).toBe(35000);
    expect(result!.groundSpeed).toBe(451);
    expect(result!.heading).toBe(270);
    expect(result!.verticalRate).toBe(-500);
    expect(result!.squawk).toBe('1200');
    expect(result!.emergency).toBe(false);
    expect(result!.onGround).toBe(false);
  });

  it('returns null when lat is missing', () => {
    expect(transformAirplanesLive({ ...base, lat: undefined })).toBeNull();
  });

  it('returns null when lon is missing', () => {
    expect(transformAirplanesLive({ ...base, lon: undefined })).toBeNull();
  });

  it('handles ground altitude', () => {
    const result = transformAirplanesLive({ ...base, alt_baro: 'ground' });
    expect(result!.altitude).toBe(0);
    expect(result!.onGround).toBe(true);
  });

  it('falls back to geometric altitude when baro is missing', () => {
    const result = transformAirplanesLive({ ...base, alt_baro: undefined });
    expect(result!.altitude).toBe(35200);
  });

  it('trims callsign whitespace', () => {
    const result = transformAirplanesLive({ ...base, flight: '  TAM3141  ' });
    expect(result!.callsign).toBe('TAM3141');
    expect(result!.airline).toBe('TAM');
  });

  it('detects emergency', () => {
    const result = transformAirplanesLive({ ...base, emergency: 'general' });
    expect(result!.emergency).toBe(true);
  });

  it('treats emergency "none" as no emergency', () => {
    const result = transformAirplanesLive({ ...base, emergency: 'none' });
    expect(result!.emergency).toBe(false);
  });

  it('handles missing optional fields', () => {
    const minimal: AirplanesLiveAircraft = { hex: 'abcdef', lat: 0, lon: 0 };
    const result = transformAirplanesLive(minimal);
    expect(result).not.toBeNull();
    expect(result!.callsign).toBeNull();
    expect(result!.registration).toBeNull();
    expect(result!.aircraftType).toBeNull();
    expect(result!.airline).toBeNull();
    expect(result!.altitude).toBeNull();
    expect(result!.groundSpeed).toBeNull();
    expect(result!.heading).toBeNull();
    expect(result!.verticalRate).toBeNull();
    expect(result!.squawk).toBeNull();
    expect(result!.emergency).toBe(false);
    expect(result!.onGround).toBe(false);
  });

  it('derives airline from callsign (first 3 alpha chars)', () => {
    expect(transformAirplanesLive({ ...base, flight: 'BAW456' })!.airline).toBe('BAW');
    expect(transformAirplanesLive({ ...base, flight: 'DLH789' })!.airline).toBe('DLH');
  });

  it('returns null airline for numeric callsigns', () => {
    expect(transformAirplanesLive({ ...base, flight: '12345' })!.airline).toBeNull();
  });

  it('lowercases hex', () => {
    expect(transformAirplanesLive({ ...base, hex: 'ABCDEF' })!.hex).toBe('abcdef');
  });

  it('computes lastSeen from seen field', () => {
    const result = transformAirplanesLive({ ...base, seen: 5 });
    const expected = Date.now() - 5000;
    expect(result!.lastSeen).toBe(expected);
  });

  it('derives country code from hex', () => {
    // A835AF is in US range (0xa00000-0xafffff)
    expect(transformAirplanesLive(base)!.countryCode).toBe('US');
  });
});

describe('transformOpenSky', () => {
  const base: OpenSkyStateVector = [
    'a835af',   // 0 icao24
    'UAL123 ',  // 1 callsign
    'United States', // 2 origin_country
    1712318400, // 3 time_position
    1712318400, // 4 last_contact
    -73.7781,   // 5 longitude
    40.6413,    // 6 latitude
    10668,      // 7 baro_altitude meters (~35000 ft)
    false,      // 8 on_ground
    231.5,      // 9 velocity m/s (~450 kts)
    270,        // 10 true_track
    -2.5,       // 11 vertical_rate m/s
    null,       // 12 sensors
    10700,      // 13 geo_altitude
    '1200',     // 14 squawk
    false,      // 15 spi
    0,          // 16 position_source
  ];

  it('transforms a complete state vector', () => {
    const result = transformOpenSky(base);
    expect(result).not.toBeNull();
    expect(result!.hex).toBe('a835af');
    expect(result!.callsign).toBe('UAL123');
    expect(result!.lat).toBe(40.6413);
    expect(result!.lon).toBe(-73.7781);
    expect(result!.squawk).toBe('1200');
    expect(result!.onGround).toBe(false);
  });

  it('converts meters to feet for altitude', () => {
    const result = transformOpenSky(base);
    // 10668m ≈ 34,997 ft
    expect(result!.altitude).toBeGreaterThan(34900);
    expect(result!.altitude).toBeLessThan(35100);
  });

  it('converts m/s to knots for speed', () => {
    const result = transformOpenSky(base);
    // 231.5 m/s ≈ 450 kts
    expect(result!.groundSpeed).toBeGreaterThan(445);
    expect(result!.groundSpeed).toBeLessThan(455);
  });

  it('returns null when lat is missing', () => {
    const noLat: OpenSkyStateVector = [...base];
    noLat[6] = null;
    expect(transformOpenSky(noLat)).toBeNull();
  });

  it('returns null when lon is missing', () => {
    const noLon: OpenSkyStateVector = [...base];
    noLon[5] = null;
    expect(transformOpenSky(noLon)).toBeNull();
  });

  it('handles null optional fields', () => {
    const minimal: OpenSkyStateVector = [
      'abcdef', null, 'Unknown', null, 1712318400,
      10.0, 20.0, null, false, null,
      null, null, null, null, null,
      false, 0,
    ];
    const result = transformOpenSky(minimal);
    expect(result).not.toBeNull();
    expect(result!.callsign).toBeNull();
    expect(result!.altitude).toBeNull();
    expect(result!.groundSpeed).toBeNull();
    expect(result!.heading).toBeNull();
    expect(result!.verticalRate).toBeNull();
    expect(result!.squawk).toBeNull();
  });

  it('registration and aircraftType are always null for OpenSky', () => {
    const result = transformOpenSky(base);
    expect(result!.registration).toBeNull();
    expect(result!.aircraftType).toBeNull();
  });

  it('origin and destination are always null for OpenSky', () => {
    const result = transformOpenSky(base);
    expect(result!.origin).toBeNull();
    expect(result!.destination).toBeNull();
  });
});
