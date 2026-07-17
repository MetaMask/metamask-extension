import { type BridgeController } from '@metamask/bridge-controller';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { getIsSmartTransaction } from '../../../shared/lib/selectors';
import { BridgeAppState } from '../bridge/selectors';
import { getMaybeHexChainId } from '../bridge/utils';

const callBridgeControllerMethod = <Action extends keyof BridgeController>(
  bridgeAction: Action,
  ...args: BridgeController[Action] extends (...a: infer A) => unknown
    ? A
    : never
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
  };
};

export const updateBatchSellTrades = (
  quotes: Parameters<BridgeController['updateBatchSellTrades']>[0],
  chain: string,
) => {
  return async (
    dispatch: MetaMaskReduxDispatch,
    getState: () => BridgeAppState,
  ) => {
    const hexChainId = getMaybeHexChainId(chain);
    const isSmartTransaction = hexChainId
      ? getIsSmartTransaction(getState(), hexChainId)
      : false;
    await dispatch(
      callBridgeControllerMethod(
        'updateBatchSellTrades',
        quotes,
        isSmartTransaction,
      ),
    );
  };
};
