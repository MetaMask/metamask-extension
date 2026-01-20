import { ConsoleErrorBuffer } from './console-error-buffer';

describe('ConsoleErrorBuffer', () => {
  describe('add', () => {
    it('keeps the most recent entries within capacity', () => {
      const buffer = new ConsoleErrorBuffer(2);

      buffer.add({ timestamp: 1, message: 'first', source: 'one' });
      buffer.add({ timestamp: 2, message: 'second', source: 'two' });
      buffer.add({ timestamp: 3, message: 'third', source: 'three' });

      const entries = buffer.getAll();

      expect(entries).toHaveLength(2);
      expect(entries[0].message).toBe('second');
      expect(entries[1].message).toBe('third');
    });
  });

  describe('getRecent', () => {
    it('returns an empty list when count is zero', () => {
      const buffer = new ConsoleErrorBuffer(3);

      buffer.add({ timestamp: 1, message: 'first', source: 'one' });

      expect(buffer.getRecent(0)).toHaveLength(0);
    });

    it('returns the most recent entries when count is positive', () => {
      const buffer = new ConsoleErrorBuffer(4);

      buffer.add({ timestamp: 1, message: 'first', source: 'one' });
      buffer.add({ timestamp: 2, message: 'second', source: 'two' });
      buffer.add({ timestamp: 3, message: 'third', source: 'three' });

      const recent = buffer.getRecent(2);

      expect(recent).toHaveLength(2);
      expect(recent[0].message).toBe('second');
      expect(recent[1].message).toBe('third');
    });
  });

  describe('size', () => {
    it('returns the number of stored entries', () => {
      const buffer = new ConsoleErrorBuffer(2);

      expect(buffer.size).toBe(0);

      buffer.add({ timestamp: 1, message: 'first', source: 'one' });

      expect(buffer.size).toBe(1);
    });
  });
});
