import { describe, it, expect } from 'vitest';
import { icaoHexToCountry, countryCodeToFlag } from './icao-country';

describe('icaoHexToCountry', () => {
  it('maps US hex addresses', () => {
    expect(icaoHexToCountry('a835af')).toBe('US');
    expect(icaoHexToCountry('A00001')).toBe('US');
    expect(icaoHexToCountry('AFFFFF')).toBe('US');
  });

  it('maps UK hex addresses', () => {
    expect(icaoHexToCountry('400000')).toBe('GB');
    expect(icaoHexToCountry('43FFFF')).toBe('GB');
  });

  it('maps Brazilian hex addresses', () => {
    expect(icaoHexToCountry('E40000')).toBe('BR');
    expect(icaoHexToCountry('E7FFFF')).toBe('BR');
  });

  it('maps German hex addresses', () => {
    expect(icaoHexToCountry('3C0000')).toBe('DE');
    expect(icaoHexToCountry('3FFFFF')).toBe('DE');
  });

  it('maps Chinese hex addresses', () => {
    expect(icaoHexToCountry('780000')).toBe('CN');
    expect(icaoHexToCountry('7BFFFF')).toBe('CN');
  });

  it('maps Australian hex addresses', () => {
    expect(icaoHexToCountry('7C0000')).toBe('AU');
    expect(icaoHexToCountry('7FFFFF')).toBe('AU');
  });

  it('maps Russian hex addresses', () => {
    expect(icaoHexToCountry('100000')).toBe('RU');
    expect(icaoHexToCountry('1FFFFF')).toBe('RU');
  });

  it('maps Canadian hex addresses', () => {
    expect(icaoHexToCountry('C00000')).toBe('CA');
    expect(icaoHexToCountry('C3FFFF')).toBe('CA');
  });

  it('maps Japanese hex addresses', () => {
    expect(icaoHexToCountry('840000')).toBe('JP');
    expect(icaoHexToCountry('87FFFF')).toBe('JP');
  });

  it('returns null for unknown hex ranges', () => {
    expect(icaoHexToCountry('000000')).toBeNull();
    expect(icaoHexToCountry('FFFFFF')).toBeNull();
  });

  it('returns null for invalid hex', () => {
    expect(icaoHexToCountry('ZZZZZZ')).toBeNull();
    expect(icaoHexToCountry('')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(icaoHexToCountry('a835af')).toBe(icaoHexToCountry('A835AF'));
  });
});

describe('countryCodeToFlag', () => {
  it('converts US to flag emoji', () => {
    expect(countryCodeToFlag('US')).toBe('🇺🇸');
  });

  it('converts GB to flag emoji', () => {
    expect(countryCodeToFlag('GB')).toBe('🇬🇧');
  });

  it('converts BR to flag emoji', () => {
    expect(countryCodeToFlag('BR')).toBe('🇧🇷');
  });

  it('converts JP to flag emoji', () => {
    expect(countryCodeToFlag('JP')).toBe('🇯🇵');
  });

  it('converts DE to flag emoji', () => {
    expect(countryCodeToFlag('DE')).toBe('🇩🇪');
  });

  it('is case-insensitive', () => {
    expect(countryCodeToFlag('us')).toBe('🇺🇸');
    expect(countryCodeToFlag('gb')).toBe('🇬🇧');
  });
});
