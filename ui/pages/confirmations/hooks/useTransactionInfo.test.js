import { CHAIN_IDS } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { getSelectedInternalAccountFromMockState } from '../../../../test/jest/mocks';
import { useTransactionInfo } from './useTransactionInfo';

const mockSelectedInternalAccount =
  getSelectedInternalAccountFromMockState(mockState);

describe('useTransactionInfo', () => {
  describe('isNftTransfer', () => {
    it('should return false if transaction is not NFT transfer', () => {
      const { result } = renderHookWithProvider(
        () =>
          useTransactionInfo({
            chainId: CHAIN_IDS.GOERLI,
            txParams: {},
          }),
        mockState,
      );
      expect(result.current.isNftTransfer).toStrictEqual(false);
    });

    it('should return true if transaction is NFT transfer', () => {
      mockState.metamask.allNftContracts = {
        [mockSelectedInternalAccount.address]: {
          [CHAIN_IDS.GOERLI]: [{ address: '0x9' }],
        },
      };

      const { result } = renderHookWithProvider(
        () =>
          useTransactionInfo({
            chainId: CHAIN_IDS.GOERLI,
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
