import type { Patch } from 'immer';
import { PatchBuffer } from './PatchBuffer';

const patch = (value: unknown): Patch =>
  ({ op: 'replace', path: ['x'], value }) as Patch;

describe('PatchBuffer', () => {
  let buffer: PatchBuffer;

  beforeEach(() => {
    buffer = new PatchBuffer();
  });

  describe('add', () => {
    it('accepts patches for a new key', () => {
      buffer.add('TokensController', [patch(1)]);
      expect(buffer.hasPending).toBe(true);
    });

    it('ignores empty patch arrays and leaves buffer empty', () => {
      buffer.add('TokensController', []);
      expect(buffer.hasPending).toBe(false);
    });

    it('appends patches for the same key', () => {
      buffer.add('A', [patch(1)]);
      buffer.add('A', [patch(2), patch(3)]);
      const result = buffer.flush();
      expect(result?.A).toHaveLength(3);
    });

    it('stores patches for different keys separately', () => {
      buffer.add('A', [patch(1)]);
      buffer.add('B', [patch(2)]);
      const result = buffer.flush();
      expect(Object.keys(result ?? {})).toHaveLength(2);
      expect(result?.A).toHaveLength(1);
      expect(result?.B).toHaveLength(1);
    });

    it('does not hold a reference to the caller-supplied array', () => {
      const patches: Patch[] = [patch(1)];
      buffer.add('A', patches);
      // Mutating the original array after calling add must not affect the buffer
      patches.push(patch(2));
      const result = buffer.flush();
      expect(result?.A).toHaveLength(1);
    });
  });

  describe('flush', () => {
    it('returns null when the buffer is empty', () => {
      expect(buffer.flush()).toBeNull();
    });

    it('returns all buffered patches as a keyed record', () => {
      buffer.add('A', [patch(1)]);
      buffer.add('B', [patch(2)]);
      const result = buffer.flush();
      expect(result).not.toBeNull();
      expect(result?.A).toHaveLength(1);
      expect(result?.B).toHaveLength(1);
    });

    it('clears the buffer after flushing', () => {
      buffer.add('A', [patch(1)]);
      buffer.flush();
      expect(buffer.hasPending).toBe(false);
      expect(buffer.flush()).toBeNull();
    });

    it('successive calls each return only patches added since the last flush', () => {
      buffer.add('A', [patch(1)]);
      buffer.flush();
      buffer.add('B', [patch(2)]);
      const result = buffer.flush();
      expect(result).not.toHaveProperty('A');
      expect(result).toHaveProperty('B');
    });
  });

  describe('hasPending', () => {
    it('is false on a new buffer', () => {
      expect(buffer.hasPending).toBe(false);
    });

    it('is true after adding patches', () => {
      buffer.add('A', [patch(1)]);
      expect(buffer.hasPending).toBe(true);
    });

    it('is false after flush', () => {
      buffer.add('A', [patch(1)]);
      buffer.flush();
      expect(buffer.hasPending).toBe(false);
    });

    it('remains false when only empty arrays are added', () => {
      buffer.add('A', []);
      expect(buffer.hasPending).toBe(false);
    });
  });

  describe('burst accumulation', () => {
    it('accumulates N rapid adds without loss across multiple keys', () => {
      const N = 500;
      const KEYS = 10;

      for (let i = 0; i < N; i++) {
        buffer.add(`Controller${i % KEYS}`, [patch(i)]);
      }

      const result = buffer.flush();
      expect(result).not.toBeNull();

      const totalPatches = Object.values(result ?? {}).flat().length;
      expect(totalPatches).toBe(N);

      // Each key should have N/KEYS patches
      for (let k = 0; k < KEYS; k++) {
        expect(result?.[`Controller${k}`]).toHaveLength(N / KEYS);
      }
    });
  });

  describe('destroy', () => {
    it('discards all pending patches', () => {
      buffer.add('A', [patch(1)]);
      buffer.add('B', [patch(2)]);
      buffer.destroy();
      expect(buffer.hasPending).toBe(false);
      expect(buffer.flush()).toBeNull();
    });

    it('is safe to call on an already-empty buffer', () => {
      expect(() => buffer.destroy()).not.toThrow();
    });
  });
});
