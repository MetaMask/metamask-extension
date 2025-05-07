/* eslint-disable camelcase */
import { TransactionControllerTransactionFailedEvent } from '@metamask/transaction-controller';
import {
  formatChainIdToHex,
  isEthUsdt,
  StatusTypes,
} from '@metamask/bridge-controller';
// eslint-disable-next-line import/no-restricted-paths
import {
  BridgeStatusControllerBridgeTransactionCompleteEvent,
  BridgeStatusControllerBridgeTransactionFailedEvent,
} from '@metamask/bridge-status-controller';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
// eslint-disable-next-line import/no-restricted-paths
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
// eslint-disable-next-line import/no-restricted-paths
import { CrossChainSwapsEventProperties } from '../../../../ui/hooks/bridge/useCrossChainSwapsEventTracker';
import { getCommonProperties } from '../../../../shared/lib/bridge-status/metrics';
// eslint-disable-next-line import/no-restricted-paths
import { type ActionType } from '../../../../ui/hooks/bridge/events/types';
import { type MetricsBackgroundState } from '../../../../shared/types/bridge-status';
import { getTokenUsdValue } from './metrics-utils';

type TrackEvent = (
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) => void;

export const handleBridgeTransactionComplete = async (
  payload: BridgeStatusControllerBridgeTransactionCompleteEvent['payload'][0],
  {
    backgroundState,
    trackEvent,
  }: {
    backgroundState: MetricsBackgroundState;
    trackEvent: TrackEvent;
  },
) => {
  const { bridgeHistoryItem } = payload;
  const { hasApprovalTx, quote } = bridgeHistoryItem;
  const state = { metamask: backgroundState };

  const common = getCommonProperties(bridgeHistoryItem, state);
  const {
    chain_id_destination,
    usd_actual_gas,
    usd_quoted_return,
    usd_quoted_gas,
  } = common;

  // Get received dest token usd price
  const destTokenAmountAtomic =
    bridgeHistoryItem.status.destChain?.amount ?? '0';
  const destTokenAmount = calcTokenAmount(
    destTokenAmountAtomic,
    bridgeHistoryItem.quote.destAsset.decimals,
  ).toNumber();
  const destTokenUsdValue =
    (await getTokenUsdValue({
      chainId: formatChainIdToHex(chain_id_destination),
      tokenAmount: destTokenAmount,
      tokenAddress: quote.destAsset.address,
      state,
    })) ?? 0;

  const quote_vs_execution_ratio =
    usd_quoted_return && destTokenUsdValue
      ? usd_quoted_return / destTokenUsdValue
      : 0;

  const quoted_vs_used_gas_ratio =
    usd_quoted_gas && usd_actual_gas ? usd_quoted_gas / usd_actual_gas : 0;

  // Get tx statuses
  const source_transaction = StatusTypes.COMPLETE;
  const destination_transaction = StatusTypes.COMPLETE;

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

  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionCompleted] & {
    action_type: ActionType;
  } = {
    ...common,

    usd_actual_return: destTokenUsdValue,
    quote_vs_execution_ratio,
    quoted_vs_used_gas_ratio,

    ...allowanceResetTransaction,
    ...approvalTransaction,
    source_transaction,
    destination_transaction,
  };

  trackEvent({
    category: MetaMetricsEventCategory.CrossChainSwaps,
    event: MetaMetricsEventName.ActionCompleted,
    properties,
  });
};

/**
 * This handles the BridgeStatusController:bridgeTransactionFailed event.
 * This is to capture bridge txs that fail on the source or destination chain.
 * We directly receive the bridgeHistoryItem as a payload here.
 *
 * @param payload
 * @param options0
 * @param options0.backgroundState
 * @param options0.trackEvent
 */
export const handleBridgeTransactionFailed = async (
  payload: BridgeStatusControllerBridgeTransactionFailedEvent['payload'][0],
  {
    backgroundState,
    trackEvent,
  }: {
    backgroundState: MetricsBackgroundState;
    trackEvent: TrackEvent;
  },
) => {
  const { bridgeHistoryItem } = payload;
  const { hasApprovalTx, quote, status } = bridgeHistoryItem;
  const state = { metamask: backgroundState };
  const common = getCommonProperties(bridgeHistoryItem, state);

  // Get tx statuses
  const source_transaction = status.srcChain.txHash
    ? StatusTypes.COMPLETE
    : StatusTypes.FAILED;
  const destination_transaction = status.destChain?.txHash
    ? StatusTypes.COMPLETE
    : StatusTypes.FAILED;

  const isEthUsdtTx = isEthUsdt(
    decimalToPrefixedHex(quote.srcChainId),
    quote.srcAsset.address,
  );

  const allowance_reset_transaction =
    isEthUsdtTx && hasApprovalTx && status.srcChain.txHash
      ? StatusTypes.COMPLETE
      : StatusTypes.FAILED;
  const approval_transaction =
    hasApprovalTx && status.srcChain.txHash
      ? StatusTypes.COMPLETE
      : StatusTypes.FAILED;

  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionFailed] =
    {
      ...common,

      allowance_reset_transaction,
      approval_transaction,
      source_transaction,
      destination_transaction,

      error_message: '',
    };

  trackEvent({
    category: MetaMetricsEventCategory.CrossChainSwaps,
    event: MetaMetricsEventName.ActionFailed,
    properties,
  });
};

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
