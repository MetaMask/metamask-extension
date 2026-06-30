import {
  type QuoteMetadata,
  type QuoteResponse,
  UnifiedSwapBridgeEventName,
  type RequiredEventContextFromClient,
} from '@metamask/bridge-controller';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMaskReduxDispatch } from '../../store/store';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
const callBridgeStatusControllerMethod = <T extends unknown[]>(
  bridgeAction: 'submitTx' | 'submitIntent' | 'submitBatchSell',
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
 * @param location - Entry point from which the user initiated the swap or bridge.
 * @param tokenSecurityTypeDestination - Security classification of the destination token (e.g. "Malicious", "Warning"), or null when unavailable.
 * @returns A thunk that dispatches the `submitTx` bridge status action.
 */
export const submitBridgeTx = (
  accountAddress: string,
  quote: QuoteResponse & QuoteMetadata,
  isStxSupportedInClient: boolean,
  context: RequiredEventContextFromClient[UnifiedSwapBridgeEventName.QuotesReceived],
  location: MetaMetricsSwapsEventSource,
  tokenSecurityTypeDestination: string | null,
) =>
  callBridgeStatusControllerMethod<
    [
      string,
      QuoteResponse & QuoteMetadata,
      boolean,
      RequiredEventContextFromClient[UnifiedSwapBridgeEventName.QuotesReceived],
      MetaMetricsSwapsEventSource,
      undefined,
      undefined,
      string | null,
    ]
  >('submitTx', [
    accountAddress,
    quote,
    isStxSupportedInClient,
    context,
    location,
    undefined,
    undefined,
    tokenSecurityTypeDestination,
  ]);

/**
 * Submit an intent quote through the bridge status controller.
 *
 * @param params - Intent submission payload.
 * @param params.quoteResponse - Quote response that contains the intent data.
 * @param params.accountAddress - Account submitting the signed intent.
 * @param params.location - Entry point from which the user initiated the swap or bridge.
 * @param params.tokenSecurityTypeDestination - Security classification of the destination token (e.g. "Malicious", "Warning"), or null when unavailable.
 * @returns A thunk that dispatches the `submitIntent` bridge status action.
 */
export const submitBridgeIntent = (params: {
  quoteResponse: QuoteResponse & QuoteMetadata;
  accountAddress: string;
  location: MetaMetricsSwapsEventSource;
  tokenSecurityTypeDestination?: string | null;
}) =>
  callBridgeStatusControllerMethod<[typeof params]>('submitIntent', [params]);

/**
 * Submit a batch-sell trade through the bridge status controller. The
 * controller accepts a list of recommended quotes (one per send asset slot)
 * and submits them together as a gasless batch.
 *
 * @param params - Batch-sell submission payload.
 * @param params.quoteResponses - Recommended quote per send slot. `null` slots
 * are filtered out by the controller.
 * @param params.accountAddress - Account submitting the batch.
 * @param params.isStxEnabled - Whether smart transactions are enabled for the client.
 * @param params.quotesReceivedContext - Optional metrics context captured when quotes were received.
 * @param params.tokenSecurityTypeDestination - Security classification of the destination token, or null when unavailable.
 * @returns A thunk that dispatches the `submitBatchSell` bridge status action.
 */
export const submitBatchSellTrade = (params: {
  quoteResponses: ((QuoteResponse & QuoteMetadata) | null)[];
  accountAddress: string;
  isStxEnabled: boolean;
  quotesReceivedContext?: RequiredEventContextFromClient[UnifiedSwapBridgeEventName.QuotesReceived];
  tokenSecurityTypeDestination?: string | null;
}) =>
  callBridgeStatusControllerMethod<[typeof params]>('submitBatchSell', [
    params,
  ]);
