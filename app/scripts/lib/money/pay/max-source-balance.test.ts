import {
  clearMaxSourceBalance,
  getMaxSourceBalance,
  setMaxSourceBalance,
} from './max-source-balance';

describe('max-source-balance', () => {
  afterEach(() => {
    clearMaxSourceBalance('tx-1');
    clearMaxSourceBalance('tx-2');
  });

  describe('setMaxSourceBalance', () => {
    it('records the balance for the transaction', () => {
      setMaxSourceBalance('tx-1', '5879662');

      expect(getMaxSourceBalance('tx-1')).toBe('5879662');
    });

    it('ignores a zero balance', () => {
      setMaxSourceBalance('tx-1', '0');

      expect(getMaxSourceBalance('tx-1')).toBeUndefined();
    });

    it('ignores a non-numeric balance', () => {
      setMaxSourceBalance('tx-1', 'not-a-number');

      expect(getMaxSourceBalance('tx-1')).toBeUndefined();
    });

    it('drops a previously recorded balance when the new one is zero', () => {
      setMaxSourceBalance('tx-1', '5879662');
      setMaxSourceBalance('tx-1', '0');

      expect(getMaxSourceBalance('tx-1')).toBeUndefined();
    });

    it('evicts the oldest entry beyond the retention cap', () => {
      setMaxSourceBalance('tx-1', '1');

      for (let index = 0; index < 10; index++) {
        setMaxSourceBalance(`filler-${index}`, '2');
      }

      expect(getMaxSourceBalance('tx-1')).toBeUndefined();

      for (let index = 0; index < 10; index++) {
        clearMaxSourceBalance(`filler-${index}`);
      }
    });
  });

  describe('clearMaxSourceBalance', () => {
    it('removes the recorded balance', () => {
      setMaxSourceBalance('tx-1', '5879662');
      clearMaxSourceBalance('tx-1');

      expect(getMaxSourceBalance('tx-1')).toBeUndefined();
    });

    it('leaves other transactions untouched', () => {
      setMaxSourceBalance('tx-1', '1');
      setMaxSourceBalance('tx-2', '2');
      clearMaxSourceBalance('tx-1');

      expect(getMaxSourceBalance('tx-2')).toBe('2');
    });
  });
});
