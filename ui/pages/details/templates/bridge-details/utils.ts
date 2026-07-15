import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { TokenAmount } from '../../../../../shared/lib/activity/types';

export function getBridgeHistoryTokens(
  bridgeHistoryItem?: BridgeHistoryItem,
): { sourceToken: TokenAmount; destinationToken: TokenAmount } | undefined {
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
}
