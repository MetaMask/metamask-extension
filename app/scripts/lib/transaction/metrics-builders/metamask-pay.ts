import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type {
  TransactionPayControllerState,
  TransactionPayQuote,
  TransactionPayRequiredToken,
} from '@metamask/transaction-pay-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import type { Json } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { merge } from 'lodash';
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import { getManifestFlags } from '../../../../../shared/lib/manifestFlags';
import { getIsPayAmountPrefillEnabled } from '../../../../../shared/lib/transaction/pay-prefill';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import type { TransactionMetricsRequest } from '../../../../../shared/types/metametrics';
import type { MetricsProperties, TransactionMetricsBuilder } from './types';

// TODO: Replace with direct `TransactionData` import once exported from @metamask/transaction-pay-controller
type TransactionData = TransactionPayControllerState['transactionData'][string];

const PAY_TYPES = [
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
  TransactionType.musdConversion,
  TransactionType.musdClaim,
];

const USE_CASE_MAP: [TransactionType[], string][] = [
  [[TransactionType.perpsDeposit], 'perps_deposit'],
  [[TransactionType.perpsWithdraw], 'perps_withdraw'],
  [[TransactionType.musdConversion], 'musd_conversion'],
  [[TransactionType.musdClaim], 'musd_claim'],
];

// Pay types whose confirmations support pre-filling the amount field.
const PREFILL_TYPES = [TransactionType.musdConversion];

export const getMetaMaskPayProperties: TransactionMetricsBuilder = ({
  eventName,
  transactionMeta,
  transactionMetricsRequest,
}) => {
  const properties: MetricsProperties = {};
  const { id: transactionId } = transactionMeta;
  const isPayType = hasTransactionType(transactionMeta, PAY_TYPES);

  const allTransactions = transactionMetricsRequest.getAllTransactions();
  const parentTransaction = allTransactions.find((tx) =>
    tx.requiredTransactionIds?.includes(transactionId),
  );

  if (isPayType || !parentTransaction) {
    addPayTypeProperties(
      properties,
      transactionMeta,
      transactionMetricsRequest,
    );

    if (isPayType || properties.mm_pay) {
      addTimeToComplete(
        properties,
        eventName,
        transactionMeta,
        allTransactions,
      );
    }

    return { properties, sensitiveProperties: {} };
  }

  addPayTypeProperties(
    properties,
    parentTransaction,
    transactionMetricsRequest,
  );

  const relatedTransactionIds = parentTransaction.requiredTransactionIds ?? [];
  properties.mm_pay_transaction_step =
    relatedTransactionIds.indexOf(transactionId) + 1;

  if (
    [TransactionType.bridge, TransactionType.swap].includes(
      transactionMeta.type as TransactionType,
    )
  ) {
    const txPayData = transactionMetricsRequest.getTransactionPayData(
      parentTransaction.id,
    );
    const quotes: TransactionPayQuote<Json>[] = txPayData?.quotes ?? [];

    const quoteTransactionIds = relatedTransactionIds.filter((id: string) =>
      allTransactions.some(
        (tx) =>
          tx.id === id &&
          [TransactionType.bridge, TransactionType.swap].includes(
            tx.type as TransactionType,
          ),
      ),
    );

    const quoteIndex = quoteTransactionIds.indexOf(transactionMeta.id);
    const quote = quotes[quoteIndex];

    if (
      quote &&
      quote.request?.targetTokenAddress !==
        '0x0000000000000000000000000000000000000000'
    ) {
      properties.mm_pay_dust_usd = quote.dust?.usd;
    }
  }

  return { properties, sensitiveProperties: {} };
};

function getLatestChildSubmittedTime(
  transactionMeta: TransactionMeta,
  allTransactions: TransactionMeta[],
): number | undefined {
  const { requiredTransactionIds } = transactionMeta;

  const submittedTimes = allTransactions
    .filter((tx) => requiredTransactionIds?.includes(tx.id))
    .map((tx) => tx.submittedTime)
    .filter((t): t is number => typeof t === 'number');

  return submittedTimes.length > 0 ? Math.max(...submittedTimes) : undefined;
}

function addTimeToComplete(
  properties: MetricsProperties,
  eventName: string,
  transactionMeta: TransactionMeta,
  allTransactions: TransactionMeta[],
) {
  if (eventName !== TransactionMetaMetricsEvent.finalized) {
    return;
  }

  const submittedTime =
    getLatestChildSubmittedTime(transactionMeta, allTransactions) ??
    transactionMeta.submittedTime;

  if (typeof submittedTime !== 'number') {
    return;
  }

  properties.mm_pay_time_to_complete_s =
    Math.round(Date.now() - submittedTime) / 1000;
}

function addPayTypeProperties(
  properties: MetricsProperties,
  transaction: TransactionMeta,
  transactionMetricsRequest: Pick<
    TransactionMetricsRequest,
    | 'getFeatureFlags'
    | 'getTransactionPayData'
    | 'getTransactionUIMetricsFragment'
  >,
) {
  const { id: transactionId, metamaskPay } = transaction;

  if (properties.mm_pay) {
    return;
  }

  // Prefill values are recorded on the parent confirmation's UI metrics
  // fragment. Read them from the parent here so they ride along to the
  // executed child transactions whose events are actually emitted.
  const fragmentProperties =
    transactionMetricsRequest.getTransactionUIMetricsFragment(
      transactionId,
    )?.properties;

  const prefilledAmount = fragmentProperties?.mm_pay_prefilled_amount;

  if (prefilledAmount !== undefined) {
    properties.mm_pay_prefilled_amount = prefilledAmount;
  }

  const amountInputType = fragmentProperties?.mm_pay_amount_input_type;

  const prefillType = PREFILL_TYPES.find((type) =>
    hasTransactionType(transaction, [type]),
  );

  if (amountInputType !== undefined) {
    properties.mm_pay_amount_input_type = amountInputType;
  } else if (
    prefillType &&
    getIsPayAmountPrefillEnabled(
      {
        // Manifest flags take precedence, matching the UI's
        // getRemoteFeatureFlags selector.
        remoteFeatureFlags: merge(
          {},
          transactionMetricsRequest.getFeatureFlags(),
          getManifestFlags().remoteFeatureFlags,
        ),
      },
      prefillType,
    )
  ) {
    // Transaction Added fires before the confirmation UI records the actual
    // input type (and before a payment token is selected), so tag the
    // experiment arm from the feature flag.
    properties.mm_pay_amount_input_type = 'prefilled_max';
  }

  if (!metamaskPay?.chainId || !metamaskPay?.tokenAddress) {
    return;
  }

  properties.mm_pay = true;
  properties.mm_pay_chain_selected = metamaskPay.chainId;

  const txPayData: TransactionData | undefined =
    transactionMetricsRequest.getTransactionPayData(transactionId);

  properties.mm_pay_token_selected = txPayData?.paymentToken?.symbol;

  for (const [types, useCase] of USE_CASE_MAP) {
    if (hasTransactionType(transaction, types)) {
      properties.mm_pay_use_case = useCase;
      break;
    }
  }

  if (!txPayData) {
    return;
  }

  const { quotes, totals, tokens } = txPayData;
  const primaryRequiredToken: TransactionPayRequiredToken | undefined =
    tokens?.find((t) => !t.skipIfBalance);

  if (primaryRequiredToken) {
    properties.mm_pay_sending_value_usd = Number(
      primaryRequiredToken.amountUsd ?? '0',
    );
  }

  if (totals) {
    properties.mm_pay_receiving_value_usd = Number(totals.targetAmount.usd);
    properties.mm_pay_metamask_fee_usd = Number(totals.fees.metaMask.usd);
    properties.mm_pay_provider_fee_usd = totals.fees.provider.usd;
    properties.mm_pay_network_fee_usd = new BigNumber(
      totals.fees.sourceNetwork.estimate.usd,
    )
      .plus(totals.fees.targetNetwork.usd)
      .toString(10);
  }

  const strategy = quotes?.[0]?.strategy;

  if (strategy === TransactionPayStrategy.Relay) {
    properties.mm_pay_strategy = 'relay';
  }

  properties.mm_pay_transaction_step_total = (quotes?.length ?? 0) + 1;
  properties.mm_pay_transaction_step = properties.mm_pay_transaction_step_total;
}
