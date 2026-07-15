import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectBridgeHistoryItemByHash } from '../../../../ducks/bridge-status/selectors';
import type { MetaMaskReduxState } from '../../../../store/store';
import { getBridgeHistoryTokens } from './utils';

export const useBridgeHistoryItem = (sourceTxHash?: string) => {
  return useSelector((state) =>
    sourceTxHash
      ? selectBridgeHistoryItemByHash(state as MetaMaskReduxState, sourceTxHash)
      : undefined,
  );
};

export const useHistoryTokens = (sourceTxHash?: string) => {
  const bridgeHistoryItem = useBridgeHistoryItem(sourceTxHash);

  return useMemo(
    () => getBridgeHistoryTokens(bridgeHistoryItem),
    [bridgeHistoryItem],
  );
};
