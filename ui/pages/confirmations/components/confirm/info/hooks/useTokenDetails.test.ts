import { TransactionMeta } from '@metamask/transaction-controller';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import { MOCK_CONFIRMATIONS_ACCOUNT_ID } from '../../../../../../../test/data/confirmations/helper';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { useTokenDetails } from './useTokenDetails';

const ICON_SYMBOL = 'FROG';
const ICON_URL =
  'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0a2c375553e6965b42c135bb8b15a8914b08de0c.png';

function tokenAssetId(chainId: string, tokenAddress: string) {
  return `eip155:${Number.parseInt(chainId, 16)}/erc20:${tokenAddress.toLowerCase()}`;
}

describe('useTokenDetails', () => {
  it('returns token details from allTokens if the token is imported', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;
    const assetId = tokenAssetId(
      transactionMeta.chainId,
      transactionMeta.txParams.to as string,
    );

    const stateWithToken = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        assetsInfo: {
          ...mockState.metamask.assetsInfo,
          [assetId]: {
            type: 'erc20',
            symbol: ICON_SYMBOL,
            image: ICON_URL,
            decimals: 9,
          },
        },
        customAssets: {
          [MOCK_CONFIRMATIONS_ACCOUNT_ID]: [assetId],
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

  it('uses the original token address when the transaction is wrapped', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;
    const originalTxParams = { ...transactionMeta.txParams };
    transactionMeta.txParamsOriginal = originalTxParams;
    transactionMeta.txParams = {
      ...transactionMeta.txParams,
      to: '0x1111111111111111111111111111111111111111',
    };
    const assetId = tokenAssetId(
      transactionMeta.chainId,
      originalTxParams.to as string,
    );

    const stateWithToken = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        assetsInfo: {
          ...mockState.metamask.assetsInfo,
          [assetId]: {
            type: 'erc20',
            symbol: ICON_SYMBOL,
            image: ICON_URL,
            decimals: 9,
          },
        },
        customAssets: {
          [MOCK_CONFIRMATIONS_ACCOUNT_ID]: [assetId],
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
        customAssets: {},
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
    const wrongChainAssetId = tokenAssetId(
      '0x999',
      transactionMeta.txParams.to as string,
    );

    const stateWithWrongChain = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        assetsInfo: {
          ...mockState.metamask.assetsInfo,
          [wrongChainAssetId]: {
            type: 'erc20',
            symbol: ICON_SYMBOL,
            decimals: 9,
          },
        },
        customAssets: {
          [MOCK_CONFIRMATIONS_ACCOUNT_ID]: [wrongChainAssetId],
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
    const differentAssetId = tokenAssetId(
      transactionMeta.chainId,
      '0x0000000000000000000000000000000000000def',
    );

    const stateWithDifferentToken = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        assetsInfo: {
          ...mockState.metamask.assetsInfo,
          [differentAssetId]: {
            type: 'erc20',
            symbol: ICON_SYMBOL,
            image: ICON_URL,
            decimals: 9,
          },
        },
        customAssets: {
          [MOCK_CONFIRMATIONS_ACCOUNT_ID]: [differentAssetId],
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
