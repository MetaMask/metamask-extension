import { BigNumber } from 'bignumber.js';
import { isHexString } from 'ethereumjs-util';
import {
  NestedTransactionMetadata,
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Json, add0x, createProjectLogger } from '@metamask/utils';
import { Hex } from 'viem';
import {
  MESSAGE_TYPE,
  ORIGIN_METAMASK,
} from '../../../../shared/constants/app';
import {
  GasRecommendations,
  PriorityLevels,
} from '../../../../shared/constants/gas';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
  MetaMetricsEventTransactionEstimateType,
} from '../../../../shared/constants/metametrics';
import {
  EIP5792ErrorCode,
  NATIVE_TOKEN_ADDRESS,
  TokenStandard,
  TransactionApprovalAmountType,
  TransactionMetaMetricsEvent,
} from '../../../../shared/constants/transaction';
import {
  calcGasTotal,
  getSwapsTokensReceivedFromTxMeta,
  TRANSACTION_ENVELOPE_TYPE_NAMES,
} from '../../../../shared/lib/transactions-controller-utils';
import {
  addHexes,
  hexToDecimal,
  hexWEIToDecETH,
  hexWEIToDecGWEI,
} from '../../../../shared/modules/conversion.utils';
import { getSmartTransactionMetricsProperties } from '../../../../shared/modules/metametrics';
import {
  determineTransactionAssetType,
  isEIP1559Transaction,
} from '../../../../shared/modules/transaction.utils';
import {
  getBlockaidMetricsProps,
  getSwapAndSendMetricsProps,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/helpers/utils/metrics';
import type {
  TransactionEventPayload,
  TransactionMetaEventPayload,
  TransactionMetricsRequest,
} from '../../../../shared/types/metametrics';

import { getSnapAndHardwareInfoForMetrics } from '../snap-keyring/metrics';
import { shouldUseRedesignForTransactions } from '../../../../shared/lib/confirmation.utils';
import { getMaximumGasTotalInHexWei } from '../../../../shared/modules/gas.utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { extractRpcDomain } from '../util';

const log = createProjectLogger('transaction-metrics');

export const METRICS_STATUS_FAILED = 'failed on-chain';

const CONTRACT_INTERACTION_TYPES = [
  TransactionType.contractInteraction,
  TransactionType.tokenMethodApprove,
  TransactionType.tokenMethodIncreaseAllowance,
  TransactionType.tokenMethodSafeTransferFrom,
  TransactionType.tokenMethodSetApprovalForAll,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.swap,
  TransactionType.swapAndSend,
  TransactionType.swapApproval,
];

/**
 * This function is called when a transaction is added to the controller.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionAdded = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }
  const { properties, sensitiveProperties } =
    await buildEventFragmentProperties({
      transactionEventPayload,
      transactionMetricsRequest,
    });

  createTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.added,
    transactionEventPayload,
    transactionMetricsRequest,
    payload: {
      properties,
      sensitiveProperties,
    },
  });
};

/**
 * This function is called when a transaction is approved by the user.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionApproved = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }

  await createUpdateFinalizeTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.approved,
    transactionEventPayload,
    transactionMetricsRequest,
  });
};

/**
 * This function is called when a transaction is failed.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 * @param transactionEventPayload.error - The error message if the transaction failed
 */
export const handleTransactionFailed = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extraParams = {} as Record<string, any>;
  if (transactionEventPayload.error) {
    // This is a failed transaction
    extraParams.error = transactionEventPayload.error;
  }

  await createUpdateFinalizeTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.finalized,
    extraParams,
    transactionEventPayload,
    transactionMetricsRequest,
  });
};

/**
 * This function is called when a transaction is confirmed.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 * @param transactionEventPayload.error - The error message if the transaction failed
 */
export const handleTransactionConfirmed = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionMetaEventPayload,
) => {
  if (Object.keys(transactionEventPayload).length === 0) {
    return;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extraParams = {} as Record<string, any>;
  const transactionMeta = { ...transactionEventPayload };
  const { txReceipt } = transactionMeta;

  extraParams.gas_used = txReceipt?.gasUsed;
  extraParams.block_number =
    txReceipt?.blockNumber && hexToDecimal(txReceipt.blockNumber);

  const { submittedTime, blockTimestamp } = transactionMeta;

  if (submittedTime) {
    extraParams.completion_time = getTransactionCompletionTime(submittedTime);
  }

  if (submittedTime && blockTimestamp) {
    extraParams.completion_time_onchain = getTransactionOnchainCompletionTime(
      submittedTime,
      blockTimestamp,
    );
  }

  if (txReceipt?.status === '0x0') {
    extraParams.status = METRICS_STATUS_FAILED;
  }
  await createUpdateFinalizeTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.finalized,
    extraParams,
    transactionEventPayload: {
      actionId: transactionMeta.actionId,
      transactionMeta,
    },
    transactionMetricsRequest,
  });
};

/**
 * This function is called when a transaction is dropped.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionDropped = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }

  const extraParams = {
    dropped: true,
  };

  await createUpdateFinalizeTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.finalized,
    extraParams,
    transactionEventPayload,
    transactionMetricsRequest,
  });
};

/**
 * This function is called when a transaction is rejected by the user.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionRejected = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }

  await createUpdateFinalizeTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.rejected,
    transactionEventPayload,
    transactionMetricsRequest,
  });
};

/**
 * This function is called when a transaction is submitted to the network.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 */
export const handleTransactionSubmitted = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
) => {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }
  const { properties, sensitiveProperties } =
    await buildEventFragmentProperties({
      transactionEventPayload,
      transactionMetricsRequest,
    });

  createTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.submitted,
    transactionEventPayload,
    transactionMetricsRequest,
    payload: {
      properties,
      sensitiveProperties,
    },
  });
};

/**
 * UI needs this specific create function in order to be sure that event fragment exists when updating transaction gas values.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param eventPayload - The event payload
 * @param eventPayload.actionId - The action id of the transaction
 * @param eventPayload.transactionId - The transaction id
 */
export const createTransactionEventFragmentWithTxId = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  {
    transactionId,
    actionId,
  }: {
    transactionId: string;
    actionId: string;
  },
) => {
  const transactionMeta = {
    ...transactionMetricsRequest.getTransaction(transactionId),
    actionId,
  };

  const { properties, sensitiveProperties } =
    await buildEventFragmentProperties({
      transactionEventPayload: {
        transactionMeta,
      },
      transactionMetricsRequest,
    });
  createTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.approved,
    transactionEventPayload: {
      actionId: transactionMeta.actionId,
      transactionMeta,
    },
    transactionMetricsRequest,
    payload: {
      properties,
      sensitiveProperties,
    },
  });
};

/**
 * This function is called when a post transaction balance is updated.
 *
 * @param transactionMetricsRequest - Contains controller actions
 * @param transactionMetricsRequest.getParticipateInMetrics - Returns whether the user has opted into metrics
 * @param transactionMetricsRequest.trackEvent - MetaMetrics track event function
 * @param transactionMetricsRequest.getHDEntropyIndex - Returns Index of the currently selected HD Keyring
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The updated transaction meta
 * @param transactionEventPayload.approvalTransactionMeta - The updated approval transaction meta
 */
export const handlePostTransactionBalanceUpdate = async (
  {
    getParticipateInMetrics,
    trackEvent,
    getHDEntropyIndex,
  }: TransactionMetricsRequest,
  {
    transactionMeta,
    approvalTransactionMeta,
  }: {
    transactionMeta: TransactionMeta;
    approvalTransactionMeta?: TransactionMeta;
  },
) => {
  if (getParticipateInMetrics() && transactionMeta.swapMetaData) {
    if (transactionMeta.txReceipt?.status === '0x0') {
      trackEvent({
        event: MetaMetricsEventName.SwapFailed,
        category: MetaMetricsEventCategory.Swaps,
        sensitiveProperties: { ...transactionMeta.swapMetaData },
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: getHDEntropyIndex(),
        },
      });
    } else {
      const tokensReceived = getSwapsTokensReceivedFromTxMeta(
        transactionMeta.destinationTokenSymbol,
        transactionMeta,
        transactionMeta.destinationTokenAddress,
        transactionMeta.txParams.from,
        transactionMeta.destinationTokenDecimals,
        approvalTransactionMeta,
        transactionMeta.chainId,
      );

      const quoteVsExecutionRatio = tokensReceived
        ? // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `${new BigNumber(tokensReceived, 10)
            .div(transactionMeta.swapMetaData.token_to_amount, 10)
            .times(100)
            .round(2)}%`
        : null;

      const estimatedVsUsedGasRatio =
        transactionMeta.txReceipt?.gasUsed &&
        transactionMeta.swapMetaData.estimated_gas
          ? // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `${new BigNumber(transactionMeta.txReceipt.gasUsed, 16)
              .div(transactionMeta.swapMetaData.estimated_gas, 10)
              .times(100)
              .round(2)}%`
          : null;

      const transactionsCost = calculateTransactionsCost(
        transactionMeta,
        approvalTransactionMeta,
      );

      trackEvent({
        event: MetaMetricsEventName.SwapCompleted,
        category: MetaMetricsEventCategory.Swaps,
        sensitiveProperties: {
          ...transactionMeta.swapMetaData,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_to_amount_received: tokensReceived,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          quote_vs_executionRatio: quoteVsExecutionRatio,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          approval_gas_cost_in_eth: transactionsCost.approvalGasCostInEth,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          trade_gas_cost_in_eth: transactionsCost.tradeGasCostInEth,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          trade_and_approval_gas_cost_in_eth:
            transactionsCost.tradeAndApprovalGasCostInEth,
          // Firefox and Chrome have different implementations of the APIs
          // that we rely on for communication accross the app. On Chrome big
          // numbers are converted into number strings, on firefox they remain
          // Big Number objects. As such, we convert them here for both
          // browsers.
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_to_amount:
            transactionMeta.swapMetaData.token_to_amount.toString(10),
        },
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: getHDEntropyIndex(),
        },
      });
    }
  }
};

function calculateTransactionsCost(
  transactionMeta: TransactionMeta,
  approvalTransactionMeta?: TransactionMeta,
) {
  let approvalGasCost = '0x0';
  if (approvalTransactionMeta?.txReceipt) {
    approvalGasCost = calcGasTotal(
      approvalTransactionMeta.txReceipt.gasUsed,
      approvalTransactionMeta.txReceipt.effectiveGasPrice,
    );
  }
  const tradeGasCost = calcGasTotal(
    transactionMeta.txReceipt?.gasUsed,
    transactionMeta.txReceipt?.effectiveGasPrice,
  );
  const tradeAndApprovalGasCost = new BigNumber(tradeGasCost, 16)
    .plus(approvalGasCost, 16)
    .toString(16);
  return {
    approvalGasCostInEth: Number(hexWEIToDecETH(approvalGasCost)),
    tradeGasCostInEth: Number(hexWEIToDecETH(tradeGasCost)),
    tradeAndApprovalGasCostInEth: Number(
      hexWEIToDecETH(tradeAndApprovalGasCost),
    ),
  };
}

function createTransactionEventFragment({
  eventName,
  transactionEventPayload: { transactionMeta, actionId },
  transactionMetricsRequest,
  payload,
}: {
  eventName: TransactionMetaMetricsEvent;
  transactionEventPayload: TransactionEventPayload;
  transactionMetricsRequest: TransactionMetricsRequest;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}) {
  if (
    hasFragment(
      transactionMetricsRequest.getEventFragmentById,
      eventName,
      transactionMeta,
    ) &&
    /**
     * HACK: "transaction-submitted-<id>" fragment hack
     * can continue to createEventFragment if "transaction-submitted-<id>"  submitted fragment exists
     */
    eventName !== TransactionMetaMetricsEvent.submitted
  ) {
    return;
  }

  const uniqueIdentifier = getUniqueId(eventName, transactionMeta.id);

  switch (eventName) {
    // When a transaction is added to the controller, we know that the user
    // will be presented with a confirmation screen. The user will then
    // either confirm or reject that transaction. Each has an associated
    // event we want to track. While we don't necessarily need an event
    // fragment to model this, having one allows us to record additional
    // properties onto the event from the UI. For example, when the user
    // edits the transactions gas params we can record that property and
    // then get analytics on the number of transactions in which gas edits
    // occur.
    case TransactionMetaMetricsEvent.added:
      transactionMetricsRequest.createEventFragment({
        category: MetaMetricsEventCategory.Transactions,
        initialEvent: TransactionMetaMetricsEvent.added,
        successEvent: TransactionMetaMetricsEvent.approved,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
        actionId,
        uniqueIdentifier,
        persist: true,
      });
      break;
    // If for some reason an approval or rejection occurs without the added
    // fragment existing in memory, we create the added fragment but without
    // the initialEvent firing. This is to prevent possible duplication of
    // events. A good example why this might occur is if the user had
    // unapproved transactions in memory when updating to the version that
    // includes this change. A migration would have also helped here but this
    // implementation hardens against other possible bugs where a fragment
    // does not exist.
    case TransactionMetaMetricsEvent.approved:
    case TransactionMetaMetricsEvent.rejected:
      transactionMetricsRequest.createEventFragment({
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.approved,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
        actionId,
        uniqueIdentifier,
        persist: true,
      });
      break;
    // When a transaction is submitted it will always result in updating
    // to a finalized state (dropped, failed, confirmed) -- eventually.
    // However having a fragment started at this stage allows augmenting
    // analytics data with user interactions such as speeding up and
    // canceling the transactions. From this controllers perspective a new
    // transaction with a new id is generated for speed up and cancel
    // transactions, but from the UI we could augment the previous ID with
    // supplemental data to show user intent. Such as when they open the
    // cancel UI but don't submit. We can record that this happened and add
    // properties to the transaction event.
    case TransactionMetaMetricsEvent.submitted:
      transactionMetricsRequest.createEventFragment({
        category: MetaMetricsEventCategory.Transactions,
        initialEvent: TransactionMetaMetricsEvent.submitted,
        successEvent: TransactionMetaMetricsEvent.finalized,
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
        actionId,
        uniqueIdentifier,
        persist: true,
      });
      break;
    // If for some reason a transaction is finalized without the submitted
    // fragment existing in memory, we create the submitted fragment but
    // without the initialEvent firing. This is to prevent possible
    // duplication of events. A good example why this might occur is if th
    // user had pending transactions in memory when updating to the version
    // that includes this change. A migration would have also helped here but
    // this implementation hardens against other possible bugs where a
    // fragment does not exist.
    case TransactionMetaMetricsEvent.finalized:
      transactionMetricsRequest.createEventFragment({
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
        actionId,
        uniqueIdentifier,
        persist: true,
      });
      break;
    default:
      break;
  }
}

function updateTransactionEventFragment({
  eventName,
  transactionEventPayload: { transactionMeta },
  transactionMetricsRequest,
  payload,
}: {
  eventName: TransactionMetaMetricsEvent;
  transactionEventPayload: TransactionEventPayload;
  transactionMetricsRequest: TransactionMetricsRequest;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}) {
  const uniqueId = getUniqueId(eventName, transactionMeta.id);

  switch (eventName) {
    case TransactionMetaMetricsEvent.approved:
    case TransactionMetaMetricsEvent.rejected:
    case TransactionMetaMetricsEvent.finalized:
      transactionMetricsRequest.updateEventFragment(uniqueId, {
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
      });
      break;

    default:
      break;
  }
}

function finalizeTransactionEventFragment({
  eventName,
  transactionMetricsRequest,
  transactionEventPayload: { transactionMeta },
}: {
  eventName: TransactionMetaMetricsEvent;
  transactionEventPayload: TransactionEventPayload;
  transactionMetricsRequest: TransactionMetricsRequest;
}) {
  const uniqueId = getUniqueId(eventName, transactionMeta.id);

  switch (eventName) {
    case TransactionMetaMetricsEvent.approved:
    case TransactionMetaMetricsEvent.finalized:
      transactionMetricsRequest.finalizeEventFragment(uniqueId);
      break;

    case TransactionMetaMetricsEvent.rejected:
      transactionMetricsRequest.finalizeEventFragment(uniqueId, {
        abandoned: true,
      });
      break;

    default:
      break;
  }
}

async function createUpdateFinalizeTransactionEventFragment({
  eventName,
  transactionEventPayload,
  transactionMetricsRequest,
  extraParams = {},
}: {
  eventName: TransactionMetaMetricsEvent;
  transactionEventPayload: TransactionEventPayload;
  transactionMetricsRequest: TransactionMetricsRequest;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParams?: Record<string, any>;
}) {
  const { properties, sensitiveProperties } =
    await buildEventFragmentProperties({
      transactionEventPayload,
      transactionMetricsRequest,
      extraParams,
    });

  createTransactionEventFragment({
    eventName,
    transactionEventPayload,
    transactionMetricsRequest,
    payload: {
      properties,
      sensitiveProperties,
    },
  });

  updateTransactionEventFragment({
    eventName,
    transactionEventPayload,
    transactionMetricsRequest,
    payload: {
      properties,
      sensitiveProperties,
    },
  });

  finalizeTransactionEventFragment({
    eventName,
    transactionEventPayload,
    transactionMetricsRequest,
  });
}

function hasFragment(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEventFragmentById: (arg0: string) => any,
  eventName: TransactionMetaMetricsEvent,
  transactionMeta: TransactionMeta,
) {
  const uniqueId = getUniqueId(eventName, transactionMeta.id);
  const fragment = getEventFragmentById(uniqueId);
  return typeof fragment !== 'undefined';
}

function getUniqueId(
  eventName: TransactionMetaMetricsEvent,
  transactionId: string,
) {
  const isFinalizedOrSubmitted =
    eventName === TransactionMetaMetricsEvent.finalized ||
    eventName === TransactionMetaMetricsEvent.submitted;
  const uniqueIdentifier = `transaction-${
    isFinalizedOrSubmitted ? 'submitted' : 'added'
  }-${transactionId}`;

  return uniqueIdentifier;
}

async function buildEventFragmentProperties({
  transactionEventPayload: { transactionMeta },
  transactionMetricsRequest,
  extraParams = {},
}: {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParams?: Record<string, any>;
  transactionEventPayload: TransactionEventPayload;
  transactionMetricsRequest: TransactionMetricsRequest;
}) {
  const {
    type,
    time,
    status,
    chainId,
    origin: referrer,
    txParams: {
      gasPrice,
      gas: gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimateSuggested,
      estimateUsed,
    },
    defaultGasEstimates,
    originalType,
    replacedById,
    customTokenAmount,
    dappProposedTokenAmount,
    currentTokenBalance,
    originalApprovalAmount,
    finalApprovalAmount,
    securityProviderResponse,
    simulationFails,
    id,
    userFeeLevel,
  } = transactionMeta;
  const source = referrer === ORIGIN_METAMASK ? 'user' : 'dapp';

  const gasFeeSelected =
    userFeeLevel === 'dappSuggested' ? 'dapp_proposed' : userFeeLevel;

  const { assetType, tokenStandard } = await determineTransactionAssetType(
    transactionMeta,
    transactionMetricsRequest.provider,
    transactionMetricsRequest.getTokenStandardAndDetails,
  );

  let contractMethodName;
  if (transactionMeta.txParams.data) {
    const methodData = await transactionMetricsRequest.getMethodData(
      transactionMeta.txParams.data,
    );
    contractMethodName = methodData?.name;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gasParams = {} as Record<string, any>;

  if (isEIP1559Transaction(transactionMeta)) {
    gasParams.max_fee_per_gas = maxFeePerGas;
    gasParams.max_priority_fee_per_gas = maxPriorityFeePerGas;
  } else {
    gasParams.gas_price = gasPrice;
    gasParams.default_estimate =
      MetaMetricsEventTransactionEstimateType.DefaultEstimate;
  }

  if (defaultGasEstimates) {
    const { estimateType } = defaultGasEstimates;
    if (estimateType) {
      gasParams.default_estimate =
        estimateType === PriorityLevels.dAppSuggested
          ? MetaMetricsEventTransactionEstimateType.DappProposed
          : estimateType;

      let defaultMaxFeePerGas =
        transactionMeta.defaultGasEstimates?.maxFeePerGas;
      let defaultMaxPriorityFeePerGas =
        transactionMeta.defaultGasEstimates?.maxPriorityFeePerGas;

      if (
        [
          GasRecommendations.low,
          GasRecommendations.medium,
          GasRecommendations.high,
        ].includes(estimateType as GasRecommendations)
      ) {
        const { gasFeeEstimates } =
          await transactionMetricsRequest.getEIP1559GasFeeEstimates();
        if (gasFeeEstimates?.[estimateType]?.suggestedMaxFeePerGas) {
          defaultMaxFeePerGas =
            gasFeeEstimates[estimateType]?.suggestedMaxFeePerGas;
          gasParams.default_max_fee_per_gas = defaultMaxFeePerGas;
        }
        if (gasFeeEstimates?.[estimateType]?.suggestedMaxPriorityFeePerGas) {
          defaultMaxPriorityFeePerGas =
            gasFeeEstimates[estimateType]?.suggestedMaxPriorityFeePerGas;
          gasParams.default_max_priority_fee_per_gas =
            defaultMaxPriorityFeePerGas;
        }
      }
    }

    if (transactionMeta.defaultGasEstimates?.gas) {
      gasParams.default_gas = transactionMeta.defaultGasEstimates.gas;
    }
    if (transactionMeta.defaultGasEstimates?.gasPrice) {
      gasParams.default_gas_price =
        transactionMeta.defaultGasEstimates.gasPrice;
    }
  }

  if (estimateSuggested) {
    gasParams.estimate_suggested = estimateSuggested;
  }

  if (estimateUsed) {
    gasParams.estimate_used = estimateUsed;
  }

  if (extraParams?.gas_used) {
    gasParams.gas_used = extraParams.gas_used;
  }

  const gasParamsInGwei = getGasValuesInGWEI(gasParams);

  let eip1559Version = '0';
  if (transactionMeta.txParams.maxFeePerGas) {
    eip1559Version = '2';
  }

  const contractInteractionTypes =
    type && CONTRACT_INTERACTION_TYPES.includes(type);

  const contractMethodNames = {
    APPROVE: 'Approve',
  };

  let transactionApprovalAmountType;
  let transactionContractMethod;
  let transactionApprovalAmountVsProposedRatio;
  let transactionApprovalAmountVsBalanceRatio;
  let transactionContractAddress;
  let transactionType = TransactionType.simpleSend;
  let transactionContractMethod4Byte;
  if (type === TransactionType.swapAndSend) {
    transactionType = TransactionType.swapAndSend;
  } else if (type === TransactionType.cancel) {
    transactionType = TransactionType.cancel;
  } else if (type === TransactionType.retry && originalType) {
    transactionType = originalType;
  } else if (type === TransactionType.deployContract) {
    transactionType = TransactionType.deployContract;
  } else if (contractInteractionTypes) {
    transactionType = TransactionType.contractInteraction;
    transactionContractMethod = contractMethodName;
    transactionContractAddress = transactionMeta.txParams?.to;
    transactionContractMethod4Byte = transactionMeta.txParams?.data?.slice(
      0,
      10,
    );
    if (
      transactionContractMethod === contractMethodNames.APPROVE &&
      tokenStandard === TokenStandard.ERC20
    ) {
      if (dappProposedTokenAmount === '0' || customTokenAmount === '0') {
        transactionApprovalAmountType = TransactionApprovalAmountType.revoke;
      } else if (
        customTokenAmount &&
        customTokenAmount !== dappProposedTokenAmount
      ) {
        transactionApprovalAmountType = TransactionApprovalAmountType.custom;
      } else if (dappProposedTokenAmount) {
        transactionApprovalAmountType =
          TransactionApprovalAmountType.dappProposed;
      }
      transactionApprovalAmountVsProposedRatio =
        allowanceAmountInRelationToDappProposedValue(
          transactionApprovalAmountType,
          originalApprovalAmount,
          finalApprovalAmount,
        );
      transactionApprovalAmountVsBalanceRatio =
        allowanceAmountInRelationToTokenBalance(
          transactionApprovalAmountType,
          dappProposedTokenAmount,
          currentTokenBalance,
        );
    }
  }

  const replacedTransactionMeta = transactionMetricsRequest.getTransaction(
    replacedById as string,
  );

  const TRANSACTION_REPLACEMENT_METHODS = {
    RETRY: TransactionType.retry,
    CANCEL: TransactionType.cancel,
    SAME_NONCE: 'other',
  };

  let transactionReplaced;
  if (extraParams?.dropped) {
    transactionReplaced = TRANSACTION_REPLACEMENT_METHODS.SAME_NONCE;
    if (replacedTransactionMeta?.type === TransactionType.cancel) {
      transactionReplaced = TRANSACTION_REPLACEMENT_METHODS.CANCEL;
    } else if (replacedTransactionMeta?.type === TransactionType.retry) {
      transactionReplaced = TRANSACTION_REPLACEMENT_METHODS.RETRY;
    }
  }

  const uiCustomizations = [];
  let isAdvancedDetailsOpen = null;

  /** securityProviderResponse is used by the OpenSea <> Blockaid provider */
  // eslint-disable-next-line no-lonely-if
  if (securityProviderResponse?.flagAsDangerous === 1) {
    uiCustomizations.push(MetaMetricsEventUiCustomization.FlaggedAsMalicious);
  } else if (securityProviderResponse?.flagAsDangerous === 2) {
    uiCustomizations.push(
      MetaMetricsEventUiCustomization.FlaggedAsSafetyUnknown,
    );
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blockaidProperties: any = getBlockaidMetricsProps(transactionMeta);

  if (blockaidProperties?.ui_customizations?.length > 0) {
    uiCustomizations.push(...blockaidProperties.ui_customizations);
  }

  if (simulationFails) {
    uiCustomizations.push(MetaMetricsEventUiCustomization.GasEstimationFailed);
  }

  const isRedesignedForTransaction = shouldUseRedesignForTransactions({
    transactionMetadataType: transactionMeta.type as TransactionType,
  });
  if (isRedesignedForTransaction) {
    uiCustomizations.push(
      MetaMetricsEventUiCustomization.RedesignedConfirmation,
    );

    isAdvancedDetailsOpen =
      transactionMetricsRequest.getIsConfirmationAdvancedDetailsOpen();
  }
  const smartTransactionMetricsProperties =
    getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      transactionMeta,
    );

  const swapAndSendMetricsProperties =
    getSwapAndSendMetricsProps(transactionMeta);

  // Add Entropy Properties
  const hdEntropyProperties = {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    hd_entropy_index: transactionMetricsRequest.getHDEntropyIndex(),
  };

  let accountType;
  try {
    accountType = await transactionMetricsRequest.getAccountType(
      transactionMetricsRequest.getSelectedAddress(),
    );
  } catch (error) {
    accountType = 'error';
    log('Error getting account type for transaction metrics:', error);
  }

  /** The transaction status property is not considered sensitive and is now included in the non-anonymous event */
  let properties = {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id: chainId,
    referrer,
    source,
    status,
    network: `${parseInt(chainId, 16)}`,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    eip_1559_version: eip1559Version,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gas_edit_type: 'none',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gas_edit_attempted: 'none',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gas_estimation_failed: Boolean(simulationFails),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    account_type: accountType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    device_model: await transactionMetricsRequest.getDeviceModel(
      transactionMetricsRequest.getSelectedAddress(),
    ),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    asset_type: assetType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    token_standard: tokenStandard,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_type: transactionType,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_speed_up: type === TransactionType.retry,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_internal_id: id,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gas_fee_selected: gasFeeSelected,
    ...blockaidProperties,
    // ui_customizations must come after ...blockaidProperties
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ui_customizations: uiCustomizations.length > 0 ? uiCustomizations : null,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_advanced_view: isAdvancedDetailsOpen,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_contract_method: transactionContractMethod
      ? [transactionContractMethod]
      : [],
    ...smartTransactionMetricsProperties,
    ...swapAndSendMetricsProperties,
    ...hdEntropyProperties,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as Record<string, any>;

  const snapAndHardwareInfo = await getSnapAndHardwareInfoForMetrics(
    transactionMetricsRequest.getAccountType,
    transactionMetricsRequest.getDeviceModel,
    transactionMetricsRequest.getHardwareTypeForMetric,
    transactionMetricsRequest.snapAndHardwareMessenger,
  );
  Object.assign(properties, snapAndHardwareInfo);

  if (transactionContractMethod === contractMethodNames.APPROVE) {
    properties = {
      ...properties,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      transaction_approval_amount_type: transactionApprovalAmountType,
    };
  }

  let sensitiveProperties = {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_envelope_type: isEIP1559Transaction(transactionMeta)
      ? TRANSACTION_ENVELOPE_TYPE_NAMES.FEE_MARKET
      : TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    first_seen: time,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gas_limit: gasLimit,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_replaced: transactionReplaced,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_contract_address: transactionContractAddress
      ? [transactionContractAddress]
      : [],
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    transaction_contract_method_4byte: transactionContractMethod4Byte,
    ...extraParams,
    ...gasParamsInGwei,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as Record<string, any>;

  if (transactionContractMethod === contractMethodNames.APPROVE) {
    sensitiveProperties = {
      ...sensitiveProperties,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      transaction_approval_amount_vs_balance_ratio:
        transactionApprovalAmountVsBalanceRatio,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      transaction_approval_amount_vs_proposed_ratio:
        transactionApprovalAmountVsProposedRatio,
    };
  }

  await addBatchProperties(
    transactionMeta,
    transactionMetricsRequest.getMethodData,
    properties,
    sensitiveProperties,
  );

  addGaslessProperties(
    transactionMeta,
    properties,
    sensitiveProperties,
    transactionMetricsRequest.getAccountBalance,
  );

  // Only calculate and add domain to properties for "Transaction Submitted" and "Transaction Finalized" events
  if (
    status === TransactionStatus.submitted ||
    status === TransactionStatus.confirmed
  ) {
    // Get RPC URL from provider
    const rpcUrl = transactionMetricsRequest.getNetworkRpcUrl(
      transactionMeta.chainId,
    );
    const domain = extractRpcDomain(rpcUrl);
    properties.rpc_domain = domain;
  }

  return { properties, sensitiveProperties };
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getGasValuesInGWEI(gasParams: Record<string, any>) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gasValuesInGwei = {} as Record<string, any>;
  for (const param in gasParams) {
    if (isHexString(gasParams[param])) {
      gasValuesInGwei[param] = hexWEIToDecGWEI(gasParams[param]);
    } else {
      gasValuesInGwei[param] = gasParams[param];
    }
  }
  return gasValuesInGwei;
}

function getTransactionCompletionTime(submittedTime: number) {
  return Math.round((Date.now() - submittedTime) / 1000).toString();
}

/**
 * Returns number of seconds (rounded to the hundredths) between submitted time
 * and the block timestamp.
 *
 * @param submittedTimeMs - The UNIX timestamp in milliseconds in which the
 * transaction has been submitted
 * @param blockTimestampHex - The UNIX timestamp in seconds in hexadecimal in which
 * the transaction has been confirmed in a block
 */
function getTransactionOnchainCompletionTime(
  submittedTimeMs: number,
  blockTimestampHex: string,
): string {
  const DECIMAL_DIGITS = 2;

  const blockTimestampSeconds = Number(hexToDecimal(blockTimestampHex));
  const completionTimeSeconds = blockTimestampSeconds - submittedTimeMs / 1000;
  const completionTimeSecondsRounded =
    Math.round(completionTimeSeconds * 10 ** DECIMAL_DIGITS) /
    10 ** DECIMAL_DIGITS;

  return completionTimeSecondsRounded.toString();
}

/**
 * The allowance amount in relation to the dapp proposed amount for specific token
 *
 * @param transactionApprovalAmountType - The transaction approval amount type
 * @param originalApprovalAmount - The original approval amount is the originally dapp proposed token amount
 * @param finalApprovalAmount - The final approval amount is the chosen amount which will be the same as the
 * originally dapp proposed token amount if the user does not edit the amount or will be a custom token amount set by the user
 */
function allowanceAmountInRelationToDappProposedValue(
  transactionApprovalAmountType?: TransactionApprovalAmountType,
  originalApprovalAmount?: string,
  finalApprovalAmount?: string,
) {
  if (
    transactionApprovalAmountType === TransactionApprovalAmountType.custom &&
    originalApprovalAmount &&
    finalApprovalAmount
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${new BigNumber(originalApprovalAmount, 10)
      .div(finalApprovalAmount, 10)
      .times(100)
      .round(2)}`;
  }
  return null;
}

/**
 * The allowance amount in relation to the balance for that specific token
 *
 * @param transactionApprovalAmountType - The transaction approval amount type
 * @param dappProposedTokenAmount - The dapp proposed token amount
 * @param currentTokenBalance - The balance of the token that is being send
 */
function allowanceAmountInRelationToTokenBalance(
  transactionApprovalAmountType?: TransactionApprovalAmountType,
  dappProposedTokenAmount?: string,
  currentTokenBalance?: string,
) {
  if (
    (transactionApprovalAmountType === TransactionApprovalAmountType.custom ||
      transactionApprovalAmountType ===
        TransactionApprovalAmountType.dappProposed) &&
    dappProposedTokenAmount &&
    currentTokenBalance
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${new BigNumber(dappProposedTokenAmount, 16)
      .div(currentTokenBalance, 10)
      .times(100)
      .round(2)}`;
  }
  return null;
}

async function addBatchProperties(
  transactionMeta: TransactionMeta,
  getMethodData: (data: string) => Promise<{ name?: string } | undefined>,
  properties: Record<string, Json | undefined>,
  sensitiveProperties: Record<string, Json | undefined>,
) {
  const isExternal = origin && origin !== ORIGIN_METAMASK;
  const { delegationAddress, nestedTransactions, txParams } = transactionMeta;
  const { authorizationList } = txParams;
  const isBatch = Boolean(nestedTransactions?.length);
  const isUpgrade = Boolean(authorizationList?.length);

  if (isExternal) {
    properties.api_method = isBatch
      ? MESSAGE_TYPE.WALLET_SEND_CALLS
      : MESSAGE_TYPE.ETH_SEND_TRANSACTION;
  }

  if (isBatch) {
    properties.batch_transaction_count = nestedTransactions?.length;
    properties.batch_transaction_method = 'eip7702';

    properties.transaction_contract_method = await getNestedMethodNames(
      nestedTransactions ?? [],
      getMethodData,
    );

    sensitiveProperties.transaction_contract_address = nestedTransactions
      ?.filter(
        (tx) =>
          CONTRACT_INTERACTION_TYPES.includes(tx.type as TransactionType) &&
          tx.to?.length,
      )
      .map((tx) => tx.to as string);
  }

  if (transactionMeta.status === TransactionStatus.rejected) {
    const { error } = transactionMeta;

    properties.eip7702_upgrade_rejection =
      // @ts-expect-error Code has string type in controller
      isUpgrade && error.code === EIP5792ErrorCode.RejectedUpgrade;
  }

  properties.eip7702_upgrade_transaction = isUpgrade;
  sensitiveProperties.account_eip7702_upgraded = delegationAddress;
}

function addGaslessProperties(
  transactionMeta: TransactionMeta,
  properties: Record<string, Json | undefined>,
  _sensitiveProperties: Record<string, Json | undefined>,
  getAccountBalance: (account: Hex, chainId: Hex) => Hex,
) {
  const {
    batchId,
    batchTransactions,
    gasFeeTokens,
    nestedTransactions,
    selectedGasFeeToken,
  } = transactionMeta;

  properties.gas_payment_tokens_available = gasFeeTokens?.map(
    (token) => token.symbol,
  );

  properties.gas_paid_with = gasFeeTokens?.find(
    (token) =>
      token.tokenAddress.toLowerCase() === selectedGasFeeToken?.toLowerCase(),
  )?.symbol;

  if (selectedGasFeeToken?.toLowerCase() === NATIVE_TOKEN_ADDRESS) {
    properties.gas_paid_with = 'pre-funded_ETH';
  }

  properties.gas_insufficient_native_asset = isInsufficientNativeBalance(
    transactionMeta,
    getAccountBalance,
  );

  // Temporary pending nested transaction type support
  if (batchId && !batchTransactions?.length && !nestedTransactions?.length) {
    properties.transaction_type = 'gas_payment';
  }
}

async function getNestedMethodNames(
  transactions: NestedTransactionMetadata[],
  getMethodData: (data: string) => Promise<{ name?: string } | undefined>,
): Promise<string[]> {
  const allData = transactions
    .filter(
      (tx) =>
        CONTRACT_INTERACTION_TYPES.includes(tx.type as TransactionType) &&
        tx.data,
    )
    .map((tx) => tx.data as Hex);

  const results = await Promise.all(allData.map((data) => getMethodData(data)));

  const names = results
    .map((result) => result?.name)
    .filter((name) => name?.length) as string[];

  return names;
}

function isInsufficientNativeBalance(
  transactionMeta: TransactionMeta,
  getAccountBalance: (account: Hex, chainId: Hex) => Hex,
) {
  const { chainId, txParams } = transactionMeta;
  const { from, gas, gasPrice, maxFeePerGas, value } = txParams;
  const nativeBalance = getAccountBalance(from as Hex, chainId);

  const gasCost = getMaximumGasTotalInHexWei({
    gasLimit: gas,
    gasPrice,
    maxFeePerGas,
  });

  const totalCost = add0x(addHexes(gasCost, value ?? '0x0'));

  return new Numeric(totalCost, 16).greaterThan(new Numeric(nativeBalance, 16));
}
