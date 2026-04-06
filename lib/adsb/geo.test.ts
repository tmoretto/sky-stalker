import { describe, it, expect } from 'vitest';
import {
  isWidebody,
  getAircraftSizeClass,
  haversineDistance,
  boundingBox,
  predictEntryMinutes,
} from './geo';

describe('isWidebody', () => {
  it('returns true for exact widebody codes', () => {
    const widebodies = ['A332', 'A380', 'B744', 'B789', 'B78X', 'B77W', 'MD11', 'IL96'];
    for (const t of widebodies) {
      expect(isWidebody(t)).toBe(true);
    }
  });

  it('returns true for widebody prefix matches', () => {
    expect(isWidebody('A350')).toBe(true);
    expect(isWidebody('B763')).toBe(true);
    expect(isWidebody('B788')).toBe(true);
  });

  it('returns false for narrowbodies', () => {
    expect(isWidebody('A320')).toBe(false);
    expect(isWidebody('B738')).toBe(false);
    expect(isWidebody('E190')).toBe(false);
  });

  it('returns false for null or empty', () => {
    expect(isWidebody(null)).toBe(false);
    expect(isWidebody('')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isWidebody('b789')).toBe(true);
    expect(isWidebody('a380')).toBe(true);
  });
});

describe('getAircraftSizeClass', () => {
  it('classifies widebodies', () => {
    expect(getAircraftSizeClass('B789')).toBe('widebody');
    expect(getAircraftSizeClass('A380')).toBe('widebody');
    expect(getAircraftSizeClass('B77W')).toBe('widebody');
  });

  it('classifies narrowbodies', () => {
    expect(getAircraftSizeClass('A320')).toBe('narrowbody');
    expect(getAircraftSizeClass('B738')).toBe('narrowbody');
    expect(getAircraftSizeClass('A21N')).toBe('narrowbody');
    expect(getAircraftSizeClass('E190')).toBe('narrowbody');
    expect(getAircraftSizeClass('CRJ9')).toBe('narrowbody');
    expect(getAircraftSizeClass('B752')).toBe('narrowbody');
    expect(getAircraftSizeClass('BCS3')).toBe('narrowbody');
  });

  it('classifies small/unknown as small', () => {
    expect(getAircraftSizeClass('C172')).toBe('small');
    expect(getAircraftSizeClass('PA28')).toBe('small');
    expect(getAircraftSizeClass('GLID')).toBe('small');
    expect(getAircraftSizeClass(null)).toBe('small');
    expect(getAircraftSizeClass('')).toBe('small');
  });

  it('is case-insensitive', () => {
    expect(getAircraftSizeClass('a320')).toBe('narrowbody');
    expect(getAircraftSizeClass('b789')).toBe('widebody');
  });
});

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(40.6413, -73.7781, 40.6413, -73.7781)).toBe(0);
  });

  it('calculates JFK to LAX approximately correctly', () => {
    // JFK: 40.6413, -73.7781  LAX: 33.9416, -118.4085
    // Expected ~2145 nm
    const dist = haversineDistance(40.6413, -73.7781, 33.9416, -118.4085);
    expect(dist).toBeGreaterThan(2100);
    expect(dist).toBeLessThan(2200);
  });

  it('calculates short distances (London Heathrow to Gatwick)', () => {
    // LHR: 51.47, -0.4543  LGW: 51.1537, -0.1821
    // Expected ~22 nm
    const dist = haversineDistance(51.47, -0.4543, 51.1537, -0.1821);
    expect(dist).toBeGreaterThan(20);
    expect(dist).toBeLessThan(25);
  });

  it('handles equator crossing', () => {
    const dist = haversineDistance(1, 0, -1, 0);
    // 2 degrees of latitude ≈ 120 nm
    expect(dist).toBeGreaterThan(115);
    expect(dist).toBeLessThan(125);
  });
});

describe('boundingBox', () => {
  it('returns a symmetric box around the center', () => {
    const box = boundingBox(40.0, -74.0, 10);
    expect(box.lamin).toBeLessThan(40.0);
    expect(box.lamax).toBeGreaterThan(40.0);
    expect(box.lomin).toBeLessThan(-74.0);
    expect(box.lomax).toBeGreaterThan(-74.0);
  });

  it('latitude span is approximately correct', () => {
    const box = boundingBox(0, 0, 60); // 60 nm = 1 degree latitude
    expect(box.lamax - box.lamin).toBeCloseTo(2, 1); // ±1 degree = 2 degrees total
  });

  it('longitude span widens at equator vs high latitude', () => {
    const equator = boundingBox(0, 0, 60);
    const arctic = boundingBox(70, 0, 60);
    const equatorLonSpan = equator.lomax - equator.lomin;
    const arcticLonSpan = arctic.lomax - arctic.lomin;
    expect(arcticLonSpan).toBeGreaterThan(equatorLonSpan);
  });
});

describe('predictEntryMinutes', () => {
  it('returns null when aircraft is already inside the circle', () => {
    const result = predictEntryMinutes(40.0, -74.0, 0, 250, 40.0, -74.0, 10);
    expect(result).toBeNull();
  });

  it('returns null for a stationary aircraft', () => {
    const result = predictEntryMinutes(41.0, -74.0, 0, 0, 40.0, -74.0, 10);
    expect(result).toBeNull();
  });

  it('returns null when aircraft is flying away', () => {
    // Aircraft north of center, heading further north
    const result = predictEntryMinutes(42.0, -74.0, 0, 250, 40.0, -74.0, 10);
    expect(result).toBeNull();
  });

  it('returns positive minutes for an aircraft heading toward the circle', () => {
    // Aircraft ~120 nm north, heading south (180°) at 250 kts
    const result = predictEntryMinutes(42.0, -74.0, 180, 250, 40.0, -74.0, 10);
    expect(result).not.toBeNull();
    expect(result).toBeGreaterThan(0);
    // ~110 nm to edge at ~4.16 nm/min ≈ ~26 min
    expect(result!).toBeGreaterThan(20);
    expect(result!).toBeLessThan(35);
  });

  it('returns null for intersections beyond 2 hours', () => {
    // Very far aircraft, slow speed
    const result = predictEntryMinutes(50.0, -74.0, 180, 50, 40.0, -74.0, 5);
    expect(result).toBeNull();
  });
});
