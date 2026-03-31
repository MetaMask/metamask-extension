import { getLastLeverage, saveLastLeverage } from './usePerpsLastLeverage';

const STORAGE_KEY = 'perps-last-leverage';

describe('usePerpsLastLeverage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getLastLeverage', () => {
    it('returns 3 (default) when no leverage has been saved', () => {
      expect(getLastLeverage('BTC')).toBe(3);
    });

    it('returns the saved leverage for a symbol', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ BTC: 10 }));
      expect(getLastLeverage('BTC')).toBe(10);
    });

    it('is case-insensitive for symbol lookup', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ETH: 5 }));
      expect(getLastLeverage('eth')).toBe(5);
    });

    it('returns 3 for a symbol not in the map', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ BTC: 10 }));
      expect(getLastLeverage('SOL')).toBe(3);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      expect(getLastLeverage('BTC')).toBe(3);
    });

    it('handles non-object JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEY, '"string"');
      expect(getLastLeverage('BTC')).toBe(3);
    });
  });

  describe('saveLastLeverage', () => {
    it('persists leverage for a symbol', () => {
      saveLastLeverage('BTC', 10);
      expect(getLastLeverage('BTC')).toBe(10);
    });

    it('stores symbol in uppercase', () => {
      saveLastLeverage('btc', 7);
      expect(getLastLeverage('BTC')).toBe(7);
    });

    it('preserves other symbols when saving', () => {
      saveLastLeverage('BTC', 10);
      saveLastLeverage('ETH', 5);
      expect(getLastLeverage('BTC')).toBe(10);
      expect(getLastLeverage('ETH')).toBe(5);
    });

    it('overwrites previous value for the same symbol', () => {
      saveLastLeverage('BTC', 10);
      saveLastLeverage('BTC', 20);
      expect(getLastLeverage('BTC')).toBe(20);
    });
  });
});
