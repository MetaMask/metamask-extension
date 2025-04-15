/* eslint-disable camelcase */
import { TransactionControllerTransactionFailedEvent } from '@metamask/transaction-controller';
import { formatChainIdToHex, isEthUsdt } from '@metamask/bridge-controller';
// eslint-disable-next-line import/no-restricted-paths
import {
  BridgeStatusControllerBridgeTransactionCompleteEvent,
  BridgeStatusControllerBridgeTransactionFailedEvent,
} from '../../controllers/bridge-status/types';
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
import {
  StatusTypes,
  MetricsBackgroundState,
} from '../../../../shared/types/bridge-status';
import { getCommonProperties } from '../../../../shared/lib/bridge-status/metrics';
// eslint-disable-next-line import/no-restricted-paths
import { type ActionType } from '../../../../ui/hooks/bridge/events/types';
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
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id_destination,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_actual_gas,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_quoted_return,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
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

  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const quote_vs_execution_ratio =
    usd_quoted_return && destTokenUsdValue
      ? usd_quoted_return / destTokenUsdValue
      : 0;

  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const quoted_vs_used_gas_ratio =
    usd_quoted_gas && usd_actual_gas ? usd_quoted_gas / usd_actual_gas : 0;

  // Get tx statuses
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const source_transaction = StatusTypes.COMPLETE;
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const destination_transaction = StatusTypes.COMPLETE;

  const isEthUsdtTx = isEthUsdt(
    decimalToPrefixedHex(quote.srcChainId),
    quote.srcAsset.address,
  );

  const allowanceResetTransaction =
    isEthUsdtTx && hasApprovalTx
      ? // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { allowance_reset_transaction: StatusTypes.COMPLETE }
      : undefined;
  const approvalTransaction = hasApprovalTx
    ? // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { approval_transaction: StatusTypes.COMPLETE }
    : undefined;

  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionCompleted] & {
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    action_type: ActionType;
  } = {
    ...common,

    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_actual_return: destTokenUsdValue,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    quote_vs_execution_ratio,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    quoted_vs_used_gas_ratio,

    ...allowanceResetTransaction,
    ...approvalTransaction,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    source_transaction,
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const source_transaction = status.srcChain.txHash
    ? StatusTypes.COMPLETE
    : StatusTypes.FAILED;
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const destination_transaction = status.destChain?.txHash
    ? StatusTypes.COMPLETE
    : StatusTypes.FAILED;

  const isEthUsdtTx = isEthUsdt(
    decimalToPrefixedHex(quote.srcChainId),
    quote.srcAsset.address,
  );

  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const allowance_reset_transaction =
    isEthUsdtTx && hasApprovalTx && status.srcChain.txHash
      ? StatusTypes.COMPLETE
      : StatusTypes.FAILED;
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const approval_transaction =
    hasApprovalTx && status.srcChain.txHash
      ? StatusTypes.COMPLETE
      : StatusTypes.FAILED;

  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionFailed] =
    {
      ...common,

      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      allowance_reset_transaction,
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      approval_transaction,
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      source_transaction,
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      destination_transaction,

      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
  const bridgeHistoryItem =
    state.metamask.bridgeStatusState.txHistory[txMeta.id];
  const { quote, hasApprovalTx } = bridgeHistoryItem;

  const common = getCommonProperties(bridgeHistoryItem, state);

  // Get tx statuses
  // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const source_transaction = StatusTypes.FAILED;

  const isEthUsdtTx = isEthUsdt(
    decimalToPrefixedHex(quote.srcChainId),
    quote.srcAsset.address,
  );
  const allowanceResetTransaction =
    isEthUsdtTx && hasApprovalTx
      ? // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { allowance_reset_transaction: StatusTypes.COMPLETE }
      : undefined;
  const approvalTransaction = hasApprovalTx
    ? // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      { approval_transaction: StatusTypes.COMPLETE }
    : undefined;

  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionFailed] =
    {
      ...common,

      ...allowanceResetTransaction,
      ...approvalTransaction,
      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      source_transaction,

      // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_message: payload.error,
    };

  trackEvent({
    category: MetaMetricsEventCategory.CrossChainSwaps,
    event: MetaMetricsEventName.ActionFailed,
    properties,
  });
};
