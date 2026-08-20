import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectBridgeHistoryItemByHash } from '../../../../ducks/bridge-status/selectors';
import type { MetaMaskReduxState } from '../../../../store/store';
import type { TokenAmount } from '../../../../../shared/lib/activity/types';

export const useBridgeHistoryItem = (sourceTxHash?: string) => {
  return useSelector((state) =>
    sourceTxHash
      ? selectBridgeHistoryItemByHash(state as MetaMaskReduxState, sourceTxHash)
      : undefined,
  );
};

export const useHistoryTokens = (
  sourceTxHash?: string,
): { sourceToken: TokenAmount; destinationToken: TokenAmount } | undefined => {
  const bridgeHistoryItem = useBridgeHistoryItem(sourceTxHash);

  return useMemo(() => {
    if (!bridgeHistoryItem) {
      return undefined;
    }

    const { quote, status } = bridgeHistoryItem;

    return {
      sourceToken: {
        amount: quote.srcTokenAmount,
        assetId: quote.srcAsset.assetId,
        decimals: quote.srcAsset.decimals,
        direction: 'out',
        symbol: quote.srcAsset.symbol,
      },
      destinationToken: {
        amount: status.destChain?.amount ?? quote.destTokenAmount,
        assetId: quote.destAsset.assetId,
        decimals: quote.destAsset.decimals,
        direction: 'in',
        symbol: quote.destAsset.symbol,
      },
    };
  }, [bridgeHistoryItem]);
};
