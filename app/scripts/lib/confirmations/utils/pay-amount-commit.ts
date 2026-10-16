import { cloneDeep } from 'lodash';
import { BigNumber } from 'bignumber.js';
import { MUSD_DECIMALS } from '@metamask/money-account-utils';
import {
  updateEIP7702BatchData,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { GetAmountDataResponse } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import type { MoneyPayMessenger } from '../../money/pay/pay-context';

const MUSD_UNIT = 10 ** MUSD_DECIMALS;

export function parseMusdHumanAmount(
  amountHuman: string,
  roundingMode: number = BigNumber.ROUND_UP,
): bigint | undefined {
  let value: BigNumber;
  try {
    value = new BigNumber(amountHuman);
  } catch {
    return undefined;
  }

  if (!value.isFinite() || value.lte(0)) {
    return undefined;
  }

  const raw = value.times(MUSD_UNIT).round(0, roundingMode);
  if (raw.lte(0)) {
    return undefined;
  }

  return BigInt(raw.toString(10));
}

export function toMusdAmountHex(amount: bigint): Hex {
  return `0x${amount.toString(16)}` as Hex;
}

export function getTransactionMeta(
  messenger: MoneyPayMessenger,
  transactionId: string,
): TransactionMeta | undefined {
  const { transactions } = messenger.call('TransactionController:getState');
  return transactions.find((transaction) => transaction.id === transactionId);
}

export function commitTransactionPayUpdates(
  messenger: MoneyPayMessenger,
  transactionId: string,
  updates: GetAmountDataResponse['updates'],
  note: string,
  requiredAssetAmount?: Hex,
): boolean {
  const transaction = getTransactionMeta(messenger, transactionId);
  if (!transaction) {
    return false;
  }

  if (isPayCommitUnchanged(transaction, updates, requiredAssetAmount)) {
    return false;
  }

  const nextTransaction = cloneDeep(transaction);
  applyNestedAndParentCalldata(nextTransaction, updates);

  if (
    requiredAssetAmount !== undefined &&
    nextTransaction.requiredAssets?.[0]
  ) {
    nextTransaction.requiredAssets[0].amount = requiredAssetAmount;
  }

  clearAmountDerivedMetadata(nextTransaction);

  messenger.call(
    'TransactionController:updateTransaction',
    nextTransaction,
    note,
  );
  return true;
}

function isPayCommitUnchanged(
  transaction: TransactionMeta,
  updates: GetAmountDataResponse['updates'],
  requiredAssetAmount?: Hex,
): boolean {
  const hasRequiredAmount = requiredAssetAmount !== undefined;
  if (!hasRequiredAmount && updates.length === 0) {
    return false;
  }

  if (
    hasRequiredAmount &&
    transaction.requiredAssets?.[0]?.amount !== requiredAssetAmount
  ) {
    return false;
  }

  if (updates.length === 0) {
    return true;
  }

  const parentData = transaction.txParams?.data;
  if (typeof parentData !== 'string' || parentData === '0x') {
    return false;
  }

  return updates.every(
    ({ nestedTransactionIndex, data }) =>
      transaction.nestedTransactions?.[nestedTransactionIndex]?.data === data,
  );
}

function clearAmountDerivedMetadata(transaction: TransactionMeta): void {
  if (transaction.txParams) {
    transaction.txParams.gas = undefined;
  }
  transaction.gasLimitNoBuffer = undefined;
  transaction.gasUsed = undefined;
  transaction.securityAlertResponse = undefined;
  transaction.simulationData = undefined;
  transaction.simulationFails = undefined;

  if (!transaction.revert) {
    return;
  }

  delete transaction.revert.gas;
  delete transaction.revert.simulation;
  if (!transaction.revert.receipt) {
    transaction.revert = undefined;
  }
}

function applyNestedAndParentCalldata(
  transaction: TransactionMeta,
  updates: GetAmountDataResponse['updates'],
): void {
  if (!updates.length) {
    return;
  }

  const from = transaction.txParams?.from as Hex | undefined;
  if (from && transaction.nestedTransactions?.length) {
    const { nestedTransactions, transactionData } = updateEIP7702BatchData({
      from,
      transactions: transaction.nestedTransactions,
      updates: updates.map(({ nestedTransactionIndex, data }) => ({
        transactionIndex: nestedTransactionIndex,
        transactionData: data,
      })),
    });
    transaction.nestedTransactions = nestedTransactions;
    transaction.txParams.data = transactionData;
    return;
  }

  for (const { nestedTransactionIndex, data } of updates) {
    const nested = transaction.nestedTransactions?.[nestedTransactionIndex];
    if (nested) {
      nested.data = data;
    }
  }
}
