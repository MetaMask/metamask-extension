import { selectUseTransactionSimulations } from './preferences';

describe('pereference selectors', () => {
  describe('selectUseTransactionSimulations', () => {
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
