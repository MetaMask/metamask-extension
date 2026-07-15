import { useMemo } from 'react';
import { getBridgeHistoryTokens } from '../utils/getBridgeHistoryTokens';
import { useBridgeHistoryItem } from './useBridgeHistoryItem';

export const useHistoryTokens = (sourceTxHash?: string) => {
  const bridgeHistoryItem = useBridgeHistoryItem(sourceTxHash)

  return useMemo(
    () => getBridgeHistoryTokens(bridgeHistoryItem),
    [bridgeHistoryItem],
  );
}
