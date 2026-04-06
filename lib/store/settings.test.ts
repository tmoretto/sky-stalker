import { describe, it, expect, beforeEach } from 'vitest';
import { useSettings } from './settings';

describe('useSettings store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSettings.setState({
      lat: null,
      lon: null,
      radiusNm: 10,
      unitSystem: 'imperial',
      showMilitary: true,
      showHelicopters: true,
      minAltitude: null,
      maxAltitude: null,
    });
  });

  it('has correct default values', () => {
    const state = useSettings.getState();
    expect(state.lat).toBeNull();
    expect(state.lon).toBeNull();
    expect(state.radiusNm).toBe(10);
    expect(state.unitSystem).toBe('imperial');
    expect(state.showMilitary).toBe(true);
    expect(state.showHelicopters).toBe(true);
    expect(state.minAltitude).toBeNull();
    expect(state.maxAltitude).toBeNull();
  });

  it('setLocation updates lat and lon', () => {
    useSettings.getState().setLocation(51.5074, -0.1278);
    const state = useSettings.getState();
    expect(state.lat).toBe(51.5074);
    expect(state.lon).toBe(-0.1278);
  });

  it('setRadius updates radiusNm', () => {
    useSettings.getState().setRadius(50);
    expect(useSettings.getState().radiusNm).toBe(50);
  });

  it('setRadius clamps to minimum of 1', () => {
    useSettings.getState().setRadius(0);
    expect(useSettings.getState().radiusNm).toBe(1);

    useSettings.getState().setRadius(-5);
    expect(useSettings.getState().radiusNm).toBe(1);
  });

  it('setRadius clamps to maximum of 250', () => {
    useSettings.getState().setRadius(300);
    expect(useSettings.getState().radiusNm).toBe(250);

    useSettings.getState().setRadius(999);
    expect(useSettings.getState().radiusNm).toBe(250);
  });

  it('setUnitSystem switches to metric', () => {
    useSettings.getState().setUnitSystem('metric');
    expect(useSettings.getState().unitSystem).toBe('metric');
  });

  it('setUnitSystem switches back to imperial', () => {
    useSettings.getState().setUnitSystem('metric');
    useSettings.getState().setUnitSystem('imperial');
    expect(useSettings.getState().unitSystem).toBe('imperial');
  });

  it('setFilters updates filter values', () => {
    useSettings.getState().setFilters({ showMilitary: false, showHelicopters: false });
    const state = useSettings.getState();
    expect(state.showMilitary).toBe(false);
    expect(state.showHelicopters).toBe(false);
  });

  it('setFilters supports partial updates', () => {
    useSettings.getState().setFilters({ minAltitude: 1000 });
    const state = useSettings.getState();
    expect(state.minAltitude).toBe(1000);
    expect(state.showMilitary).toBe(true); // unchanged
  });

  it('setFilters can set altitude ranges', () => {
    useSettings.getState().setFilters({ minAltitude: 5000, maxAltitude: 40000 });
    const state = useSettings.getState();
    expect(state.minAltitude).toBe(5000);
    expect(state.maxAltitude).toBe(40000);
  });

  it('setFilters can clear altitude filters', () => {
    useSettings.getState().setFilters({ minAltitude: 5000, maxAltitude: 40000 });
    useSettings.getState().setFilters({ minAltitude: null, maxAltitude: null });
    const state = useSettings.getState();
    expect(state.minAltitude).toBeNull();
    expect(state.maxAltitude).toBeNull();
  });
});
