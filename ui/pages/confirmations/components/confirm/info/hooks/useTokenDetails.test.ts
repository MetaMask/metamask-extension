import { TransactionMeta } from '@metamask/transaction-controller';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { useTokenDetails } from './useTokenDetails';

const ICON_SYMBOL = 'FROG';
const ICON_URL =
  'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a2c375553e6965b42c135bb8b15a8914b08de0c.png';

describe('useTokenDetails', () => {
  it('returns token details from allTokens if the token is imported', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const stateWithToken = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        allTokens: {
          [transactionMeta.chainId]: {
            [transactionMeta.txParams.from as string]: [
              {
                address: transactionMeta.txParams.to,
                symbol: ICON_SYMBOL,
                image: ICON_URL,
                decimals: 9,
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      stateWithToken,
    );

    expect(result.current).toEqual({
      tokenImage: ICON_URL,
      tokenSymbol: ICON_SYMBOL,
    });
  });

  it('returns undefined for tokenImage and "Unknown" for tokenSymbol if token is not in allTokens', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const stateWithNoTokens = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        allTokens: {},
      },
    };

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      stateWithNoTokens,
    );

    expect(result.current).toEqual({
      tokenImage: undefined,
      tokenSymbol: 'Unknown',
    });
  });

  it('returns undefined for tokenImage and "Unknown" for tokenSymbol if chainId has no tokens', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const stateWithWrongChain = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        allTokens: {
          '0x999': {
            [transactionMeta.txParams.from as string]: [
              { address: transactionMeta.txParams.to, symbol: ICON_SYMBOL },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      stateWithWrongChain,
    );

    expect(result.current).toEqual({
      tokenImage: undefined,
      tokenSymbol: 'Unknown',
    });
  });

  it('returns undefined for tokenImage and "Unknown" for tokenSymbol if token address does not match', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const stateWithDifferentToken = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        allTokens: {
          [transactionMeta.chainId]: {
            [transactionMeta.txParams.from as string]: [
              {
                address: '0xdifferentaddress',
                symbol: ICON_SYMBOL,
                image: ICON_URL,
              },
            ],
          },
        },
      },
    };

    const { result } = renderHookWithProvider(
      () => useTokenDetails(transactionMeta),
      stateWithDifferentToken,
    );

    expect(result.current).toEqual({
      tokenImage: undefined,
      tokenSymbol: 'Unknown',
    });
  });
});
