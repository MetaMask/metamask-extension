import { isHexString } from 'ethereumjs-util';
import EthQuery from 'eth-query';
import { BigNumber } from 'bignumber.js';
import type { Provider } from '@metamask/network-controller';

import { ORIGIN_METAMASK } from '../../../shared/constants/app';
import {
  determineTransactionAssetType,
  isEIP1559Transaction,
} from '../../../shared/modules/transaction.utils';
import { hexWEIToDecGWEI } from '../../../shared/modules/conversion.utils';
import {
  TransactionType,
  TokenStandard,
  TransactionApprovalAmountType,
  TransactionMetaMetricsEvent,
  TransactionMeta,
} from '../../../shared/constants/transaction';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import { GasRecommendations } from '../../../shared/constants/gas';
import { TRANSACTION_ENVELOPE_TYPE_NAMES } from '../../../shared/lib/transactions-controller-utils';

///: BEGIN:ONLY_INCLUDE_IN(blockaid)
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
///: END:ONLY_INCLUDE_IN

const METRICS_STATUS_FAILED = 'failed on-chain';

type ControllerActions = {
  createEventFragment: (arg0: any) => any;
  finalizeEventFragment: (arg0: string, arg1?: any) => any;
  getEventFragmentById: () => any;
  updateEventFragment: (arg0: string, arg1: any) => any;
  getAccountType: (arg0: string) => Promise<any>;
  getDeviceModel: (arg0: string) => Promise<any>;
  getEIP1559GasFeeEstimates: () => any;
  getSelectedAddress: () => any;
  getTokenStandardAndDetails: () => any;
  getTransaction: (arg0: string) => TransactionMeta;
};

type TrackerDependencyMap = {
  controllerActions: ControllerActions;
  provider: Provider;
};

// transaction-added event doesn't have to update/finalize fragment
export const onTransactionAdded =
  ({ controllerActions, provider }: TrackerDependencyMap) =>
  async ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
    if (!transactionMeta) {
      return;
    }
    const { properties, sensitiveProperties } =
      await buildEventFragmentProperties({
        transactionMeta,
        controllerActions,
        provider,
      });

    createTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.added,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });
  };

export const onTransactionApproved =
  ({ controllerActions, provider }: TrackerDependencyMap) =>
  async ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
    if (!transactionMeta) {
      return;
    }
    const { properties, sensitiveProperties } =
      await buildEventFragmentProperties({
        transactionMeta,
        controllerActions,
        provider,
      });

    createTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.approved,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });

    updateTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.approved,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });

    finalizeTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.approved,
      controllerActions,
      transactionMeta,
    });
  };

export const onTransactionFinalized =
  ({ controllerActions, provider }: TrackerDependencyMap) =>
  async ({
    transactionMeta,
    error,
  }: {
    transactionMeta: TransactionMeta;
    error: string;
  }) => {
    if (!transactionMeta) {
      return;
    }

    const extraParams = {} as Record<string, any>;
    if (error) {
      // This is a failed transaction
      extraParams.error = error;
    } else {
      const { txReceipt } = transactionMeta;

      extraParams.gas_used = txReceipt.gasUsed;

      const { submittedTime } = transactionMeta;

      if (submittedTime) {
        extraParams.completion_time =
          getTransactionCompletionTime(submittedTime);
      }

      if (txReceipt.status === '0x0') {
        extraParams.status = METRICS_STATUS_FAILED;
      }
    }

    const { properties, sensitiveProperties } =
      await buildEventFragmentProperties({
        transactionMeta,
        controllerActions,
        provider,
        extraParams,
      });

    createTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.finalized,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });

    updateTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.finalized,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });

    finalizeTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.finalized,
      controllerActions,
      transactionMeta,
    });
  };

export const onTransactionDropped =
  ({ controllerActions, provider }: TrackerDependencyMap) =>
  async ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
    if (!transactionMeta) {
      return;
    }

    const extraParams = {
      dropped: true,
    };

    const { properties, sensitiveProperties } =
      await buildEventFragmentProperties({
        transactionMeta,
        controllerActions,
        provider,
        extraParams,
      });

    createTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.finalized,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });

    updateTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.finalized,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });

    finalizeTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.finalized,
      controllerActions,
      transactionMeta,
    });
  };

export const onTransactionRejected =
  ({ controllerActions, provider }: TrackerDependencyMap) =>
  async ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
    if (!transactionMeta) {
      return;
    }
    const { properties, sensitiveProperties } =
      await buildEventFragmentProperties({
        transactionMeta,
        controllerActions,
        provider,
      });

    createTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.rejected,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });

    updateTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.rejected,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });

    finalizeTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.rejected,
      controllerActions,
      transactionMeta,
    });
  };

// transaction-submitted event doesn't have to update/finalize fragment
export const onTransactionSubmitted =
  ({ controllerActions, provider }: TrackerDependencyMap) =>
  async ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
    if (!transactionMeta) {
      return;
    }
    const { properties, sensitiveProperties } =
      await buildEventFragmentProperties({
        transactionMeta,
        controllerActions,
        provider,
      });

    createTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.submitted,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });
  };

// This function is needed for a specific case in UI
export const createTransactionEventFragmentWithTxId =
  ({ controllerActions, provider }: TrackerDependencyMap) =>
  async ({
    transactionId,
    actionId,
  }: {
    transactionId: string;
    actionId: string;
  }) => {
    const transactionMeta = controllerActions.getTransaction(transactionId);

    transactionMeta.actionId = actionId;

    const { properties, sensitiveProperties } =
      await buildEventFragmentProperties({
        transactionMeta,
        controllerActions,
        provider,
      });
    createTransactionEventFragment({
      eventName: TransactionMetaMetricsEvent.approved,
      controllerActions,
      transactionMeta,
      payload: {
        properties,
        sensitiveProperties,
      },
    });
  };

function createTransactionEventFragment({
  eventName,
  transactionMeta,
  controllerActions,
  payload,
}: {
  eventName: TransactionMetaMetricsEvent;
  transactionMeta: TransactionMeta;
  controllerActions: ControllerActions;
  payload: any;
}) {
  if (
    hasFragment(
      controllerActions.getEventFragmentById,
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
      controllerActions.createEventFragment({
        category: MetaMetricsEventCategory.Transactions,
        initialEvent: TransactionMetaMetricsEvent.added,
        successEvent: TransactionMetaMetricsEvent.approved,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
        actionId: transactionMeta.actionId,
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
      controllerActions.createEventFragment({
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.approved,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
        actionId: transactionMeta.actionId,
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
      controllerActions.createEventFragment({
        category: MetaMetricsEventCategory.Transactions,
        initialEvent: TransactionMetaMetricsEvent.submitted,
        successEvent: TransactionMetaMetricsEvent.finalized,
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
        actionId: transactionMeta.actionId,
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
      controllerActions.createEventFragment({
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
        actionId: transactionMeta.actionId,
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
  controllerActions,
  transactionMeta,
  payload,
}: {
  eventName: TransactionMetaMetricsEvent;
  controllerActions: ControllerActions;
  transactionMeta: TransactionMeta;
  payload: any;
}) {
  const uniqueId = getUniqueId(eventName, transactionMeta.id);

  switch (eventName) {
    case TransactionMetaMetricsEvent.approved:
      controllerActions.updateEventFragment(uniqueId, {
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
      });
      break;

    case TransactionMetaMetricsEvent.rejected:
      controllerActions.updateEventFragment(uniqueId, {
        properties: payload.properties,
        sensitiveProperties: payload.sensitiveProperties,
      });
      break;

    case TransactionMetaMetricsEvent.finalized:
      controllerActions.updateEventFragment(uniqueId, {
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
  controllerActions,
  transactionMeta,
}: {
  eventName: TransactionMetaMetricsEvent;
  controllerActions: ControllerActions;
  transactionMeta: TransactionMeta;
}) {
  const uniqueId = getUniqueId(eventName, transactionMeta.id);

  switch (eventName) {
    case TransactionMetaMetricsEvent.approved:
      controllerActions.finalizeEventFragment(uniqueId);
      break;

    case TransactionMetaMetricsEvent.rejected:
      controllerActions.finalizeEventFragment(uniqueId, {
        abandoned: true,
      });
      break;

    case TransactionMetaMetricsEvent.finalized:
      controllerActions.finalizeEventFragment(uniqueId);
      break;
    default:
      break;
  }
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
  const isSubmitted = [
    TransactionMetaMetricsEvent.finalized,
    TransactionMetaMetricsEvent.submitted,
  ].includes(eventName);
  const uniqueIdentifier = `transaction-${
    isSubmitted ? 'submitted' : 'added'
  }-${transactionId}`;

  return uniqueIdentifier;
}

async function buildEventFragmentProperties({
  transactionMeta,
  extraParams = {},
  controllerActions: {
    getEIP1559GasFeeEstimates,
    getTokenStandardAndDetails,
    getAccountType,
    getDeviceModel,
    getSelectedAddress,
    getTransaction,
  },
  provider,
}: {
  transactionMeta: TransactionMeta;
  extraParams?: Record<string, any>;
  controllerActions: ControllerActions;
  provider: Provider;
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
    metamaskNetworkId: network,
    customTokenAmount,
    dappProposedTokenAmount,
    currentTokenBalance,
    originalApprovalAmount,
    finalApprovalAmount,
    contractMethodName,
    securityProviderResponse,
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    securityAlertResponse,
    ///: END:ONLY_INCLUDE_IN
  } = transactionMeta;

  const query = new EthQuery(provider);
  const source = referrer === ORIGIN_METAMASK ? 'user' : 'dapp';

  const { assetType, tokenStandard } = await determineTransactionAssetType(
    transactionMeta,
    query,
    getTokenStandardAndDetails,
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
        transactionMeta.defaultGasEstimates.maxFeePerGas;
      let defaultMaxPriorityFeePerGas =
        transactionMeta.defaultGasEstimates.maxPriorityFeePerGas;

      if (
        [
          GasRecommendations.low,
          GasRecommendations.medium,
          GasRecommendations.high,
        ].includes(estimateType)
      ) {
        const { gasFeeEstimates } = await getEIP1559GasFeeEstimates();
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

    if (transactionMeta.defaultGasEstimates.gas) {
      gasParams.default_gas = transactionMeta.defaultGasEstimates.gas;
    }
    if (transactionMeta.defaultGasEstimates.gasPrice) {
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

  const contractInteractionTypes = [
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
  } else if (type === TransactionType.retry) {
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

  const replacedTransactionMeta = getTransaction(replacedById as string);

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

  let uiCustomizations;

  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  if (securityAlertResponse?.result_type === BlockaidResultType.Failed) {
    uiCustomizations = ['security_alert_failed'];
  } else {
    ///: END:ONLY_INCLUDE_IN
    // eslint-disable-next-line no-lonely-if
    if (securityProviderResponse?.flagAsDangerous === 1) {
      uiCustomizations = ['flagged_as_malicious'];
    } else if (securityProviderResponse?.flagAsDangerous === 2) {
      uiCustomizations = ['flagged_as_safety_unknown'];
    } else {
      uiCustomizations = null;
    }
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  }
  ///: END:ONLY_INCLUDE_IN

  /** The transaction status property is not considered sensitive and is now included in the non-anonymous event */
  let properties = {
    chain_id: chainId,
    referrer,
    source,
    status,
    network,
    eip_1559_version: eip1559Version,
    gas_edit_type: 'none',
    gas_edit_attempted: 'none',
    account_type: await getAccountType(getSelectedAddress()),
    device_model: await getDeviceModel(getSelectedAddress()),
    asset_type: assetType,
    token_standard: tokenStandard,
    transaction_type: transactionType,
    transaction_speed_up: type === TransactionType.retry,
    ui_customizations: uiCustomizations,
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    security_alert_response:
      securityAlertResponse?.result_type ?? BlockaidResultType.NotApplicable,
    security_alert_reason:
      securityAlertResponse?.reason ?? BlockaidReason.notApplicable,
    ///: END:ONLY_INCLUDE_IN
  } as Record<string, any>;

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
