import {
  type QuoteMetadata,
  type QuoteResponse,
  UnifiedSwapBridgeEventName,
  type RequiredEventContextFromClient,
} from '@metamask/bridge-controller';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMaskReduxDispatch } from '../../store/store';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
const callBridgeStatusControllerMethod = <T extends unknown[]>(
  bridgeAction: 'submitTx' | 'submitIntent',
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
 * @param context
 * @returns
 */
export const submitBridgeTx = async (
  accountAddress: string,
  quote: QuoteResponse & QuoteMetadata,
  isStxSupportedInClient: boolean,
  context: RequiredEventContextFromClient[UnifiedSwapBridgeEventName.QuotesReceived],
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return await dispatch(
      callBridgeStatusControllerMethod<
        [
          string,
          QuoteResponse & QuoteMetadata,
          boolean,
          RequiredEventContextFromClient[UnifiedSwapBridgeEventName.QuotesReceived],
        ]
      >('submitTx', [accountAddress, quote, isStxSupportedInClient, context]),
    );
  };
};

/**
 * Submit an intent quote through the bridge status controller.
 *
 * @param params - Intent submission payload.
 * @param params.quoteResponse - Quote response that contains the intent data.
 * @param params.accountAddress - Account submitting the signed intent.
 * @param params.location - Optional surface identifier used for analytics.
 * @param params.abTests - Optional AB test metadata forwarded to metrics.
 * @returns A thunk that dispatches the `submitIntent` bridge status action.
 */
export const submitBridgeIntent = async (params: {
  quoteResponse: QuoteResponse & QuoteMetadata;
  accountAddress: string;
  location?: string;
  abTests?: Record<string, string>;
}) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    return await dispatch(
      callBridgeStatusControllerMethod<[typeof params]>('submitIntent', [
        params,
      ]),
    );
  };
};
