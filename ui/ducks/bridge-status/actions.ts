import { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
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
    await submitRequestToBackground(bridgeAction, args);
    await forceUpdateMetamaskState(dispatch);
  };
};

/**
 * Submit a solana bridge or swap transaction using the bridge status controller
 *
 * @param quote
 * @param isStxSupportedInClient
 * @returns
 */
export const submitBridgeTx = (
  quote: QuoteResponse & QuoteMetadata,
  isStxSupportedInClient: boolean,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return dispatch(
      callBridgeStatusControllerMethod<
        [QuoteResponse & QuoteMetadata, boolean]
      >(BridgeStatusAction.SUBMIT_TX, [quote, isStxSupportedInClient]),
    );
  };
};

/**
 * Submit an intent-based order (e.g., CoW) using UI-signed EIP-712 signature.
 *
 * @param params.quote - QuoteResponse including intent
 * @param params.signature - Signature from eth_signTypedData_v4
 * @param params.accountAddress - EOA submitting the order
 */
export const submitIntent = (params: {
  quote: QuoteResponse & QuoteMetadata;
  signature: string;
  accountAddress: string;
}) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    const { quote, signature, accountAddress } = params;

    const result = await dispatch(
      // Keep parity with submitTx helper wiring
      callBridgeStatusControllerMethod<[
        {
          quoteResponse: QuoteResponse & QuoteMetadata;
          signature: string;
          accountAddress: string;
        },
      ]>(BridgeStatusAction.SUBMIT_INTENT, [
        { quoteResponse: quote, signature, accountAddress },
      ]),
    );

    return result;
  };
};
