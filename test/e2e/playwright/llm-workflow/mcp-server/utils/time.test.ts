import { generateFilesafeTimestamp, generateSessionId } from './time';

describe('utils/time', () => {
  describe('generateFilesafeTimestamp', () => {
    it('generates timestamp without special characters', () => {
      const timestamp = generateFilesafeTimestamp();

      expect(timestamp).not.toContain(':');
      expect(timestamp).not.toContain('/');
      expect(timestamp).not.toContain(' ');
    });

    it('generates consistent format', () => {
      const timestamp = generateFilesafeTimestamp();

      expect(timestamp).toMatch(/^\d{8}-\d{6}-\d{3}$/u);
    });

    it('generates unique timestamps', () => {
      const timestamps = new Set<string>();
      for (let i = 0; i < 10; i++) {
        timestamps.add(generateFilesafeTimestamp());
      }

      expect(timestamps.size).toBeGreaterThan(1);
    });
  });

  describe('generateSessionId', () => {
    it('generates ID with mm- prefix', () => {
      const sessionId = generateSessionId();

      expect(sessionId).toMatch(/^mm-/u);
    });

    it('generates unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        ids.add(generateSessionId());
      }

      expect(ids.size).toBe(10);
    });

    it('generates IDs with expected format', () => {
      const sessionId = generateSessionId();

      expect(sessionId).toMatch(/^mm-[a-z0-9]+-[a-z0-9]+$/u);
    });

    it('generates reasonably short IDs', () => {
      const sessionId = generateSessionId();

      expect(sessionId.length).toBeLessThan(30);
      expect(sessionId.length).toBeGreaterThan(10);
    });
  });
});
