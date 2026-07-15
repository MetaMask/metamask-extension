import { useSelector } from 'react-redux';
import { selectBridgeHistoryItemByHash } from '../../../../../ducks/bridge-status/selectors';
import type { MetaMaskReduxState } from '../../../../../store/store';


export const useBridgeHistoryItem = (sourceTxHash?: string) => {
  return useSelector((state) =>
    sourceTxHash
      ? selectBridgeHistoryItemByHash(state as MetaMaskReduxState, sourceTxHash)
      : undefined,
  );
}
