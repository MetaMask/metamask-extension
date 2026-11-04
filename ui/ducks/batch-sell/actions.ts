import { type BridgeController } from '@metamask/bridge-controller';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../store/store';
import { getIsSmartTransaction } from '../../../shared/lib/selectors';
import type { SmartTransactionsState } from '../../../shared/lib/selectors/smart-transactions';
import { getMaybeHexChainId } from '../bridge/utils';

function getSmartTransactionsState(
  state: MetaMaskReduxState,
): SmartTransactionsState {
  // @ts-expect-error Full Redux state includes smart transaction fields at runtime.
  return state;
}

export const updateBatchSellTrades = (
  quotes: Parameters<BridgeController['updateBatchSellTrades']>[0],
  chain: string,
) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => MetaMaskReduxState,
  ) => {
    const hexChainId = getMaybeHexChainId(chain);
    const isSmartTransaction = hexChainId
      ? getIsSmartTransaction(getSmartTransactionsState(getState()), hexChainId)
      : false;
    await submitRequestToBackground('BridgeController:updateBatchSellTrades', [
      quotes,
      isSmartTransaction,
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
};
