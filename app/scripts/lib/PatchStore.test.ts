import type { Patch } from 'immer';
import { PatchStore } from './PatchStore';

describe('PatchStore', () => {
  describe('add', () => {
    it('accumulates patches under a controller key', () => {
      const store = new PatchStore();
      store.add('TokensController', [
        { op: 'replace', path: ['tokens'], value: ['0xabc'] },
      ]);

      const result = store.flush();
      expect(result).toEqual({
        TokensController: [
          { op: 'replace', path: ['tokens'], value: ['0xabc'] },
        ],
      });
    });

    it('appends patches for the same controller key', () => {
      const store = new PatchStore();
      store.add('TokensController', [
        { op: 'replace', path: ['tokens'], value: ['0xabc'] },
      ]);
      store.add('TokensController', [
        { op: 'replace', path: ['lastUpdated'], value: 1000 },
      ]);

      const result = store.flush();
      expect(result).toEqual({
        TokensController: [
          { op: 'replace', path: ['tokens'], value: ['0xabc'] },
          { op: 'replace', path: ['lastUpdated'], value: 1000 },
        ],
      });
    });

    it('accumulates patches from multiple controllers', () => {
      const store = new PatchStore();
      store.add('TokensController', [
        { op: 'replace', path: ['tokens'], value: [] },
      ]);
      store.add('NetworkController', [
        { op: 'replace', path: ['chainId'], value: '0x1' },
      ]);

      const result = store.flush();
      expect(result).toEqual({
        TokensController: [
          { op: 'replace', path: ['tokens'], value: [] },
        ],
        NetworkController: [
          { op: 'replace', path: ['chainId'], value: '0x1' },
        ],
      });
    });

    it('ignores empty patch arrays', () => {
      const store = new PatchStore();
      store.add('TokensController', []);

      expect(store.hasPending).toBe(false);
      expect(store.flush()).toBeNull();
    });
  });

  describe('flush', () => {
    it('returns null when nothing has been accumulated', () => {
      const store = new PatchStore();
      expect(store.flush()).toBeNull();
    });

    it('clears pending patches after flush', () => {
      const store = new PatchStore();
      store.add('TokensController', [
        { op: 'replace', path: ['tokens'], value: [] },
      ]);

      const first = store.flush();
      const second = store.flush();

      expect(first).not.toBeNull();
      expect(second).toBeNull();
    });

    it('does not share references with internal state', () => {
      const store = new PatchStore();
      const patches: Patch[] = [
        { op: 'replace', path: ['tokens'], value: [] },
      ];
      store.add('TokensController', patches);

      const result = store.flush();
      patches.push({ op: 'replace', path: ['extra'], value: true });

      expect(result?.TokensController).toHaveLength(1);
    });
  });

  describe('hasPending', () => {
    it('returns false initially', () => {
      const store = new PatchStore();
      expect(store.hasPending).toBe(false);
    });

    it('returns true after adding patches', () => {
      const store = new PatchStore();
      store.add('TokensController', [
        { op: 'replace', path: ['tokens'], value: [] },
      ]);
      expect(store.hasPending).toBe(true);
    });

    it('returns false after flush', () => {
      const store = new PatchStore();
      store.add('TokensController', [
        { op: 'replace', path: ['tokens'], value: [] },
      ]);
      store.flush();
      expect(store.hasPending).toBe(false);
    });
  });

  describe('destroy', () => {
    it('discards all accumulated patches', () => {
      const store = new PatchStore();
      store.add('TokensController', [
        { op: 'replace', path: ['tokens'], value: [] },
      ]);
      store.add('NetworkController', [
        { op: 'replace', path: ['chainId'], value: '0x1' },
      ]);

      store.destroy();

      expect(store.hasPending).toBe(false);
      expect(store.flush()).toBeNull();
    });
  });
});
