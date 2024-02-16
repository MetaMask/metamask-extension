import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { useTransactionInfo } from './useTransactionInfo';

describe('useTransactionInfo', () => {
  describe('isNftTransfer', () => {
    it('should return false if transaction is not NFT transfer', () => {
      const { result } = renderHookWithProvider(
        () =>
          useTransactionInfo({
            txParams: {},
          }),
        mockState,
      );
      expect(result.current.isNftTransfer).toStrictEqual(false);
    });
    it('should return true if transaction is NFT transfer', () => {
      mockState.metamask.allNftContracts = {
        [mockState.metamask.selectedAddress]: {
          [mockState.metamask.providerConfig.chainId]: [{ address: '0x9' }],
        },
      };

      const { result } = renderHookWithProvider(
        () =>
          useTransactionInfo({
            txParams: {
              to: '0x9',
            },
          }),
        mockState,
      );
      expect(result.current.isNftTransfer).toStrictEqual(true);
    });
  });
});
