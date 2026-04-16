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
 * Submit a bridge or swap quote using the bridge status controller.
 *
 * @param accountAddress - Account submitting the quote.
 * @param quote - Quote payload forwarded to the bridge status controller.
 * @param isStxSupportedInClient - Whether STX is enabled for the client.
 * @param context - Metrics context captured when quotes were received.
 * @returns A thunk that dispatches the `submitTx` bridge status action.
 */
export const submitBridgeTx = (
  accountAddress: string,
  quote: QuoteResponse & QuoteMetadata,
  isStxSupportedInClient: boolean,
  context: RequiredEventContextFromClient[UnifiedSwapBridgeEventName.QuotesReceived],
) =>
  callBridgeStatusControllerMethod<
    [
      string,
      QuoteResponse & QuoteMetadata,
      boolean,
      RequiredEventContextFromClient[UnifiedSwapBridgeEventName.QuotesReceived],
    ]
  >('submitTx', [accountAddress, quote, isStxSupportedInClient, context]);

/**
 * Submit an intent quote through the bridge status controller.
 *
 * @param params - Intent submission payload.
 * @param params.quoteResponse - Quote response that contains the intent data.
 * @param params.accountAddress - Account submitting the signed intent.
 * @returns A thunk that dispatches the `submitIntent` bridge status action.
 */
export const submitBridgeIntent = (params: {
  quoteResponse: QuoteResponse & QuoteMetadata;
  accountAddress: string;
}) =>
  callBridgeStatusControllerMethod<[typeof params]>('submitIntent', [params]);
