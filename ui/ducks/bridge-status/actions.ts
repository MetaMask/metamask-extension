import { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import {
  BridgeStatusAction,
  StartPollingForBridgeTxStatusArgsSerialized,
} from '@metamask/bridge-status-controller';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMaskReduxDispatch } from '../../store/store';

const callBridgeStatusControllerMethod = <T extends unknown[]>(
  bridgeAction: BridgeStatusAction,
  args?: T,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
  };
};

/**
 * Start polling for a bridge transaction status
 *
 * @param startPollingForBridgeTxStatusArgs
 * @returns
 * @deprecated Use `submitBridgeTx` instead
 */
export const startPollingForBridgeTxStatus = (
  startPollingForBridgeTxStatusArgs: StartPollingForBridgeTxStatusArgsSerialized,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeStatusControllerMethod<
        [StartPollingForBridgeTxStatusArgsSerialized]
      >(BridgeStatusAction.START_POLLING_FOR_BRIDGE_TX_STATUS, [
        startPollingForBridgeTxStatusArgs,
      ]),
    );
  };
};

/**
 * Submit a solana bridge or swap transaction using the bridge status controller
 *
 * @param quote
 * @returns
 */
export const submitBridgeTx = (quote: QuoteResponse & QuoteMetadata) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeStatusControllerMethod<[QuoteResponse & QuoteMetadata]>(
        BridgeStatusAction.SUBMIT_TX,
        [quote],
      ),
    );
  };
};
