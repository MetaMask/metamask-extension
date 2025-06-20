import { selectUseTransactionSimulations } from './preferences';

describe('preference selectors', () => {
  describe('getUseTransactionSimulations', () => {
    it('returns value of useTransactionSimulations from state', () => {
      const result = selectUseTransactionSimulations({
        metamask: {
          useTransactionSimulations: true,
        },
      });
      expect(result).toStrictEqual(true);
    });

    it('returns undefined if useTransactionSimulations is not set', () => {
      const result = selectUseTransactionSimulations({ metamask: {} });
      expect(result).toStrictEqual(undefined);
    });
  });
});
