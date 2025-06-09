/* eslint-disable camelcase */
import { TransactionControllerTransactionFailedEvent } from '@metamask/transaction-controller';
import { isEthUsdt, StatusTypes } from '@metamask/bridge-controller';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
// eslint-disable-next-line import/no-restricted-paths
import { CrossChainSwapsEventProperties } from '../../../../ui/hooks/bridge/useCrossChainSwapsEventTracker';
import { getCommonProperties } from '../../../../shared/lib/bridge-status/metrics';
import { type MetricsBackgroundState } from '../../../../shared/types/bridge-status';

type TrackEvent = (
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) => void;

/**
 * This handles the TransactionController:transactionFailed event.
 * This is mostly to capture bridge txs that fail on the source chain before getting to the bridge.
 * We do not receive the bridgeHistoryItem as a payload here, so we need to look it up using the txMeta.id.
 *
 * @param payload
 * @param options0
 * @param options0.backgroundState
 * @param options0.trackEvent
 */
export const handleTransactionFailedTypeBridge = async (
  payload: TransactionControllerTransactionFailedEvent['payload'][0],
  {
    backgroundState,
    trackEvent,
  }: {
    backgroundState: MetricsBackgroundState;
    trackEvent: TrackEvent;
  },
) => {
  const state = { metamask: backgroundState };
  const { transactionMeta: txMeta } = payload;
  const bridgeHistoryItem = state.metamask.txHistory[txMeta.id];
  const { quote, hasApprovalTx } = bridgeHistoryItem;

  const common = getCommonProperties(bridgeHistoryItem, state);

  // Get tx statuses
  const source_transaction = StatusTypes.FAILED;

  const isEthUsdtTx = isEthUsdt(
    decimalToPrefixedHex(quote.srcChainId),
    quote.srcAsset.address,
  );
  const allowanceResetTransaction =
    isEthUsdtTx && hasApprovalTx
      ? { allowance_reset_transaction: StatusTypes.COMPLETE }
      : undefined;
  const approvalTransaction = hasApprovalTx
    ? { approval_transaction: StatusTypes.COMPLETE }
    : undefined;

  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionFailed] =
    {
      ...common,

      ...allowanceResetTransaction,
      ...approvalTransaction,
      source_transaction,

      error_message: payload.error,
    };

  trackEvent({
    category: MetaMetricsEventCategory.CrossChainSwaps,
    event: MetaMetricsEventName.ActionFailed,
    properties,
  });
};
