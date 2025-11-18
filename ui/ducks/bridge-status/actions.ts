import {
  QuoteMetadata,
  QuoteResponse,
  QuoteWarning,
} from '@metamask/bridge-controller';
import { BridgeStatusAction } from '@metamask/bridge-status-controller';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMaskReduxDispatch } from '../../store/store';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
const callBridgeStatusControllerMethod = <T extends unknown[]>(
  bridgeAction: BridgeStatusAction,
  args?: T,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const result = await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
    return result;
  };
};

/**
 * Submit a solana bridge or swap transaction using the bridge status controller
 *
 * @param accountAddress
 * @param quote
 * @param isStxSupportedInClient
 * @param isLoading
 * @param warnings
 * @returns
 */
export const submitBridgeTx = (
  accountAddress: string,
  quote: QuoteResponse & QuoteMetadata,
  isStxSupportedInClient: boolean,
  isLoading: boolean,
  warnings: QuoteWarning[],
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeStatusControllerMethod<
        [
          string,
          QuoteResponse & QuoteMetadata,
          boolean,
          boolean,
          QuoteWarning[],
        ]
      >(BridgeStatusAction.SUBMIT_TX, [
        accountAddress,
        quote,
        isStxSupportedInClient,
        isLoading,
        warnings,
      ]),
    );
  };
};
