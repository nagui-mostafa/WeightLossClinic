import { addMilliseconds, parseDurationToMs } from './time.utils';

describe('time.utils', () => {
  describe('parseDurationToMs', () => {
    it('parses shorthand durations', () => {
      expect(parseDurationToMs('1s')).toBe(1000);
      expect(parseDurationToMs('5m')).toBe(5 * 60 * 1000);
      expect(parseDurationToMs('2h')).toBe(2 * 60 * 60 * 1000);
      expect(parseDurationToMs('3d')).toBe(3 * 24 * 60 * 60 * 1000);
      expect(parseDurationToMs('250ms')).toBe(250);
    });

    it('parses plain numbers as milliseconds', () => {
      expect(parseDurationToMs('1500')).toBe(1500);
    });

    it('throws on invalid inputs', () => {
      expect(() => parseDurationToMs('')).toThrow();
      expect(() => parseDurationToMs('abc')).toThrow();
      expect(() => parseDurationToMs('1w')).toThrow();
    });
  });

  describe('addMilliseconds', () => {
    it('adds milliseconds to a date', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      const result = addMilliseconds(date, 1500);
      expect(result.toISOString()).toBe('2025-01-01T00:00:01.500Z');
    });
  });
});
