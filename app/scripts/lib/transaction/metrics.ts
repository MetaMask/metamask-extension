import { isHexString } from 'ethereumjs-util';
import EthQuery, { Provider } from '@metamask/eth-query';
import { BigNumber } from 'bignumber.js';
import { FetchGasFeeEstimateOptions } from '@metamask/gas-fee-controller';

import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import {
  determineTransactionAssetType,
  isEIP1559Transaction,
} from '../../../../shared/modules/transaction.utils';
import {
  hexWEIToDecETH,
  hexWEIToDecGWEI,
} from '../../../../shared/modules/conversion.utils';
import {
  TokenStandard,
  TransactionApprovalAmountType,
  TransactionMetaMetricsEvent,
} from '../../../../shared/constants/transaction';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventFragment,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
  MetaMetricsPageObject,
  MetaMetricsReferrerObject,
} from '../../../../shared/constants/metametrics';
import { GasRecommendations } from '../../../../shared/constants/gas';
import {
  calcGasTotal,
  getSwapsTokensReceivedFromTxMeta,
  TRANSACTION_ENVELOPE_TYPE_NAMES,
} from '../../../../shared/lib/transactions-controller-utils';
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import { getBlockaidMetricsProps } from '../../../../ui/helpers/utils/metrics';
///: END:ONLY_INCLUDE_IF
import {
  getSnapAndHardwareInfoForMetrics,
  type SnapAndHardwareMessenger,
} from '../snap-keyring/metrics';

export type TransactionMetricsRequest = {
  createEventFragment: (
    options: MetaMetricsEventFragment,
  ) => MetaMetricsEventFragment;
  finalizeEventFragment: (
    fragmentId: string,
    options?: {
      abandoned?: boolean;
      page?: MetaMetricsPageObject;
      referrer?: MetaMetricsReferrerObject;
    },
  ) => void;
  getEventFragmentById: (fragmentId: string) => MetaMetricsEventFragment;
  updateEventFragment: (
    fragmentId: string,
    payload: Partial<MetaMetricsEventFragment>,
  ) => void;
  getAccountType: (
    address: string,
  ) => Promise<'hardware' | 'imported' | 'MetaMask'>;
  getDeviceModel: (
    address: string,
  ) => Promise<'ledger' | 'lattice' | 'N/A' | string>;
  // According to the type GasFeeState returned from getEIP1559GasFeeEstimates
  // doesn't include some properties used in buildEventFragmentProperties,
  // hence returning any here to avoid type errors.
  getEIP1559GasFeeEstimates(options?: FetchGasFeeEstimateOptions): Promise<any>;
  getParticipateInMetrics: () => boolean;
  getSelectedAddress: () => string;
  getTokenStandardAndDetails: () => {
    decimals?: string;
    balance?: string;
    symbol?: string;
    standard?: TokenStandard;
  };
  getTransaction: (transactionId: string) => TransactionMeta;
  provider: Provider;
  snapAndHardwareMessenger: SnapAndHardwareMessenger;
  trackEvent: (payload: any) => void;
};

export const METRICS_STATUS_FAILED = 'failed on-chain';

export type TransactionEventPayload = {
  transactionMeta: TransactionMeta;
  actionId?: string;
  error?: string;
};

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
  transactionEventPayload: TransactionEventPayload,
) => {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }

  const extraParams = {} as Record<string, any>;
  const { transactionMeta } = transactionEventPayload;
  const { txReceipt } = transactionMeta;

  extraParams.gas_used = txReceipt?.gasUsed;

  const { submittedTime } = transactionMeta;

  if (submittedTime) {
    extraParams.completion_time = getTransactionCompletionTime(submittedTime);
  }

  if (txReceipt?.status === '0x0') {
    extraParams.status = METRICS_STATUS_FAILED;
  }
  await createUpdateFinalizeTransactionEventFragment({
    eventName: TransactionMetaMetricsEvent.finalized,
    extraParams,
    transactionEventPayload,
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
  const transactionMeta =
    transactionMetricsRequest.getTransaction(transactionId);

  transactionMeta.actionId = actionId;

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
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The updated transaction meta
 * @param transactionEventPayload.approvalTransactionMeta - The updated approval transaction meta
 */
export const handlePostTransactionBalanceUpdate = async (
  { getParticipateInMetrics, trackEvent }: TransactionMetricsRequest,
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
        event: 'Swap Failed',
        sensitiveProperties: { ...transactionMeta.swapMetaData },
        category: MetaMetricsEventCategory.Swaps,
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
        ? `${new BigNumber(tokensReceived, 10)
            .div(transactionMeta.swapMetaData.token_to_amount, 10)
            .times(100)
            .round(2)}%`
        : null;

      const estimatedVsUsedGasRatio =
        transactionMeta.txReceipt?.gasUsed &&
        transactionMeta.swapMetaData.estimated_gas
          ? `${new BigNumber(transactionMeta.txReceipt.gasUsed, 16)
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
          token_to_amount_received: tokensReceived,
          quote_vs_executionRatio: quoteVsExecutionRatio,
          estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
          approval_gas_cost_in_eth: transactionsCost.approvalGasCostInEth,
          trade_gas_cost_in_eth: transactionsCost.tradeGasCostInEth,
          trade_and_approval_gas_cost_in_eth:
            transactionsCost.tradeAndApprovalGasCostInEth,
          // Firefox and Chrome have different implementations of the APIs
          // that we rely on for communication accross the app. On Chrome big
          // numbers are converted into number strings, on firefox they remain
          // Big Number objects. As such, we convert them here for both
          // browsers.
          token_to_amount:
            transactionMeta.swapMetaData.token_to_amount.toString(10),
        },
      });
    }
  }
};

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
/**
 * This function is called when a transaction metadata updated in the MMI controller.
 *
 * @param transactionMetricsRequest - Contains controller actions needed to create/update/finalize event fragments
 * @param transactionEventPayload - The event payload
 * @param transactionEventPayload.transactionMeta - The transaction meta object
 * @param eventName - The event name
 */
export const handleMMITransactionUpdate = async (
  transactionMetricsRequest: TransactionMetricsRequest,
  transactionEventPayload: TransactionEventPayload,
  eventName: TransactionMetaMetricsEvent,
) => {
  if (!transactionEventPayload.transactionMeta) {
    return;
  }

  await createUpdateFinalizeTransactionEventFragment({
    eventName,
    transactionEventPayload,
    transactionMetricsRequest,
  });
};
///: END:ONLY_INCLUDE_IF

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
  payload: any;
}) {
  if (
    hasFragment(
      transactionMetricsRequest.getEventFragmentById,
      eventName,
      transactionMeta,
    )
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
  payload: any;
}) {
  const uniqueId = getUniqueId(eventName, transactionMeta.id);

  switch (eventName) {
    case TransactionMetaMetricsEvent.approved:
      transactionMetricsRequest.updateEventFragment(uniqueId, {
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
      });
      break;

    case TransactionMetaMetricsEvent.rejected:
      transactionMetricsRequest.updateEventFragment(uniqueId, {
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
      });
      break;

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
      transactionMetricsRequest.finalizeEventFragment(uniqueId);
      break;

    case TransactionMetaMetricsEvent.rejected:
      transactionMetricsRequest.finalizeEventFragment(uniqueId, {
        abandoned: true,
      });
      break;

    case TransactionMetaMetricsEvent.finalized:
      transactionMetricsRequest.finalizeEventFragment(uniqueId);
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
    contractMethodName,
    securityProviderResponse,
    simulationFails,
  } = transactionMeta;
  const query = new EthQuery(transactionMetricsRequest.provider);
  const source = referrer === ORIGIN_METAMASK ? 'user' : 'dapp';

  const { assetType, tokenStandard } = await determineTransactionAssetType(
    transactionMeta,
    query,
    transactionMetricsRequest.getTokenStandardAndDetails,
  );

  const gasParams = {} as Record<string, any>;

  if (isEIP1559Transaction(transactionMeta)) {
    gasParams.max_fee_per_gas = maxFeePerGas;
    gasParams.max_priority_fee_per_gas = maxPriorityFeePerGas;
  } else {
    gasParams.gas_price = gasPrice;
  }

  if (defaultGasEstimates) {
    const { estimateType } = defaultGasEstimates;
    if (estimateType) {
      gasParams.default_estimate = estimateType;
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
    type &&
    [
      TransactionType.contractInteraction,
      TransactionType.tokenMethodApprove,
      TransactionType.tokenMethodSafeTransferFrom,
      TransactionType.tokenMethodSetApprovalForAll,
      TransactionType.tokenMethodTransfer,
      TransactionType.tokenMethodTransferFrom,
      TransactionType.smart,
      TransactionType.swap,
      TransactionType.swapApproval,
    ].includes(type);

  const contractMethodNames = {
    APPROVE: 'Approve',
  };

  let transactionApprovalAmountType;
  let transactionContractMethod;
  let transactionApprovalAmountVsProposedRatio;
  let transactionApprovalAmountVsBalanceRatio;
  let transactionType = TransactionType.simpleSend;
  if (type === TransactionType.cancel) {
    transactionType = TransactionType.cancel;
  } else if (type === TransactionType.retry && originalType) {
    transactionType = originalType;
  } else if (type === TransactionType.deployContract) {
    transactionType = TransactionType.deployContract;
  } else if (contractInteractionTypes) {
    transactionType = TransactionType.contractInteraction;
    transactionContractMethod = contractMethodName;
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

  /** securityProviderResponse is used by the OpenSea <> Blockaid provider */
  // eslint-disable-next-line no-lonely-if
  if (securityProviderResponse?.flagAsDangerous === 1) {
    uiCustomizations.push(MetaMetricsEventUiCustomization.FlaggedAsMalicious);
  } else if (securityProviderResponse?.flagAsDangerous === 2) {
    uiCustomizations.push(
      MetaMetricsEventUiCustomization.FlaggedAsSafetyUnknown,
    );
  }

  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  const blockaidProperties: any = getBlockaidMetricsProps(transactionMeta);

  if (blockaidProperties?.ui_customizations?.length > 0) {
    uiCustomizations.push(...blockaidProperties.ui_customizations);
  }
  ///: END:ONLY_INCLUDE_IF

  if (simulationFails) {
    uiCustomizations.push(MetaMetricsEventUiCustomization.GasEstimationFailed);
  }

  /** The transaction status property is not considered sensitive and is now included in the non-anonymous event */
  let properties = {
    chain_id: chainId,
    referrer,
    source,
    status,
    network: `${parseInt(chainId, 16)}`,
    eip_1559_version: eip1559Version,
    gas_edit_type: 'none',
    gas_edit_attempted: 'none',
    gas_estimation_failed: Boolean(simulationFails),
    account_type: await transactionMetricsRequest.getAccountType(
      transactionMetricsRequest.getSelectedAddress(),
    ),
    device_model: await transactionMetricsRequest.getDeviceModel(
      transactionMetricsRequest.getSelectedAddress(),
    ),
    asset_type: assetType,
    token_standard: tokenStandard,
    transaction_type: transactionType,
    transaction_speed_up: type === TransactionType.retry,
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    ...blockaidProperties,
    ///: END:ONLY_INCLUDE_IF
    // ui_customizations must come after ...blockaidProperties
    ui_customizations: uiCustomizations.length > 0 ? uiCustomizations : null,
  } as Record<string, any>;

  const snapAndHardwareInfo = await getSnapAndHardwareInfoForMetrics(
    transactionMetricsRequest.getAccountType,
    transactionMetricsRequest.getDeviceModel,
    transactionMetricsRequest.snapAndHardwareMessenger,
  );
  Object.assign(properties, snapAndHardwareInfo);

  if (transactionContractMethod === contractMethodNames.APPROVE) {
    properties = {
      ...properties,
      transaction_approval_amount_type: transactionApprovalAmountType,
    };
  }

  let sensitiveProperties = {
    transaction_envelope_type: isEIP1559Transaction(transactionMeta)
      ? TRANSACTION_ENVELOPE_TYPE_NAMES.FEE_MARKET
      : TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
    first_seen: time,
    gas_limit: gasLimit,
    transaction_contract_method: transactionContractMethod,
    transaction_replaced: transactionReplaced,
    ...extraParams,
    ...gasParamsInGwei,
  } as Record<string, any>;

  if (transactionContractMethod === contractMethodNames.APPROVE) {
    sensitiveProperties = {
      ...sensitiveProperties,
      transaction_approval_amount_vs_balance_ratio:
        transactionApprovalAmountVsBalanceRatio,
      transaction_approval_amount_vs_proposed_ratio:
        transactionApprovalAmountVsProposedRatio,
    };
  }

  return { properties, sensitiveProperties };
}

function getGasValuesInGWEI(gasParams: Record<string, any>) {
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
    return `${new BigNumber(dappProposedTokenAmount, 16)
      .div(currentTokenBalance, 10)
      .times(100)
      .round(2)}`;
  }
  return null;
}
