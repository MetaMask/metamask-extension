import {
  clearMaxSourceBalance,
  getMaxSourceBalance,
  resetMaxSourceBalancesForTests,
  setMaxSourceBalance,
} from './max-source-balance';

describe('max-source-balance', () => {
  const key = {
    transactionId: 'tx-1',
    accountAddress: '0xaccount1',
    chainId: '0x1',
    tokenAddress: '0xtoken1',
  };

  afterEach(resetMaxSourceBalancesForTests);

  describe('setMaxSourceBalance', () => {
    it('records the balance for the transaction', () => {
      setMaxSourceBalance(key, '5879662');

      expect(getMaxSourceBalance(key)).toBe('5879662');
    });

    it('ignores a zero balance', () => {
      setMaxSourceBalance(key, '0');

      expect(getMaxSourceBalance(key)).toBeUndefined();
    });

    it('ignores a non-numeric balance', () => {
      setMaxSourceBalance(key, 'not-a-number');

      expect(getMaxSourceBalance(key)).toBeUndefined();
    });

    it('drops a previously recorded balance when the new one is zero', () => {
      setMaxSourceBalance(key, '5879662');
      setMaxSourceBalance(key, '0');

      expect(getMaxSourceBalance(key)).toBeUndefined();
    });

    it('returns undefined for a different funding account', () => {
      setMaxSourceBalance(key, '5879662');

      expect(
        getMaxSourceBalance({
          ...key,
          accountAddress: '0xaccount2',
        }),
      ).toBeUndefined();
    });

    it('returns undefined for a different pay token', () => {
      setMaxSourceBalance(key, '5879662');

      expect(
        getMaxSourceBalance({
          ...key,
          tokenAddress: '0xtoken2',
        }),
      ).toBeUndefined();
    });

    it('returns undefined for a different pay-token chain', () => {
      setMaxSourceBalance(key, '5879662');

      expect(
        getMaxSourceBalance({
          ...key,
          chainId: '0x2',
        }),
      ).toBeUndefined();
    });
  });

  describe('clearMaxSourceBalance', () => {
    it('removes the recorded balance', () => {
      setMaxSourceBalance(key, '5879662');
      clearMaxSourceBalance('tx-1');

      expect(getMaxSourceBalance(key)).toBeUndefined();
    });

    it('leaves other transactions untouched', () => {
      const otherKey = { ...key, transactionId: 'tx-2' };
      setMaxSourceBalance(key, '1');
      setMaxSourceBalance(otherKey, '2');
      clearMaxSourceBalance('tx-1');

      expect(getMaxSourceBalance(otherKey)).toBe('2');
    });
  });
});
