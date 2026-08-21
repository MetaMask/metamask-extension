import {
  generateEIP7702BatchTransaction,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { cloneDeep } from 'lodash';

import type { MoneyAccountWithdrawAmountUpdate } from '../../../store/controller-actions/transaction-pay-controller';

const TRANSFER_SELECTOR = '0xa9059cbb';

/**
 * Whether calldata carries a function selector plus arguments, rather than
 * being the empty placeholder the withdraw batch is created with.
 *
 * @param data - Calldata to inspect.
 * @returns Whether the calldata is encoded.
 */
export function isEncodedCalldata(data: string | undefined): boolean {
  return Boolean(data && data !== '0x' && data !== '0x00' && data.length > 10);
}

/**
 * Reads the raw (base units) amount argument out of `transfer(to, amount)`
 * calldata.
 *
 * @param data - Calldata expected to be an ERC-20 transfer.
 * @returns The raw amount as a decimal string, or `undefined` when the
 * calldata is not a decodable transfer.
 */
export function getTransferAmountRawFromData(
  data: string | undefined,
): string | undefined {
  if (!data) {
    return undefined;
  }
  const lower = data.toLowerCase();
  if (!lower.startsWith(TRANSFER_SELECTOR) || lower.length < 138) {
    return undefined;
  }
  try {
    return BigInt(`0x${lower.slice(-64)}`).toString();
  } catch {
    return undefined;
  }
}

/**
 * Placeholder and zero-amount `transfer(recipient, 0)` calldata both look
 * "encoded" (they have a selector). The Monadscan withdraw that transferred
 * nothing was approved because we treated that zero transfer as ready.
 *
 * @param transaction - Transaction whose nested calls to inspect.
 * @returns Whether nested withdraw + transfer encode a non-zero amount.
 */
export function hasFundedWithdrawCalldata(
  transaction: TransactionMeta | undefined,
): boolean {
  if (!isEncodedCalldata(transaction?.nestedTransactions?.[0]?.data)) {
    return false;
  }
  const amountRaw = getTransferAmountRawFromData(
    transaction?.nestedTransactions?.[1]?.data,
  );
  return Boolean(amountRaw && amountRaw !== '0');
}

/**
 * Narrows an encoder result to a funded withdraw update. The UI bridge can
 * strip unknown shapes, so anything without encoded withdraw calldata and a
 * non-zero transfer amount is rejected.
 *
 * @param value - Raw value returned by the background amount encoder.
 * @returns The funded update, or `undefined` when it is not funded.
 */
export function asFundedWithdrawUpdate(
  value: unknown,
): MoneyAccountWithdrawAmountUpdate | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  if (!('withdrawData' in value) || !('transferData' in value)) {
    return undefined;
  }
  const { withdrawData, transferData } =
    value as MoneyAccountWithdrawAmountUpdate;
  if (!isEncodedCalldata(withdrawData)) {
    return undefined;
  }
  const amountRaw = getTransferAmountRawFromData(transferData);
  if (!amountRaw || amountRaw === '0') {
    return undefined;
  }
  const transactionData =
    'transactionData' in value
      ? (value as MoneyAccountWithdrawAmountUpdate).transactionData
      : undefined;
  return { withdrawData, transferData, transactionData };
}

/**
 * `addTransactionBatch` stores the parent as `batch`. Persist the withdraw
 * type on approve so the activity list does not fall through to
 * "Contract interaction".
 *
 * @param transaction - Transaction to clone and retype.
 * @returns A clone typed as a Money Account withdrawal.
 */
export function asWithdrawTransactionToApprove(
  transaction: TransactionMeta,
): TransactionMeta {
  const next = cloneDeep(transaction);
  next.type = TransactionType.moneyAccountWithdraw;
  return next;
}

/**
 * Nested withdraw + transfer can look funded while the parent still carries
 * the placeholder `execute([])` (or `execute` of empty calls). That parent
 * mines successfully and moves no funds. Rebuild `to` + `data` from the
 * nested calls so publish signs the real batch.
 *
 * @param transaction - Transaction with funded nested withdraw + transfer.
 * @returns The same transaction with parent EIP-7702 execute calldata, or
 * `null` when the nested calls are not funded.
 */
export function withFundedBatchCalldata(
  transaction: TransactionMeta | undefined,
): TransactionMeta | null {
  if (!hasFundedWithdrawCalldata(transaction) || !transaction) {
    return null;
  }
  const next = asWithdrawTransactionToApprove(transaction);
  const from = next.txParams.from as Hex;
  const batch = generateEIP7702BatchTransaction(
    from,
    next.nestedTransactions ?? [],
  );
  next.txParams = {
    ...next.txParams,
    to: batch.to ?? from,
    data: batch.data,
  };
  return next;
}

/**
 * Patches encoder-returned nested calldata onto a transaction and rebuilds
 * the parent execute calldata from it.
 *
 * @param transaction - Transaction to patch.
 * @param update - Encoded nested withdraw + transfer calldata.
 * @returns The patched transaction, or `null` when it cannot be patched into
 * a funded batch.
 */
export function applyWithdrawCalldata(
  transaction: TransactionMeta | undefined,
  update: MoneyAccountWithdrawAmountUpdate,
): TransactionMeta | null {
  if (!transaction) {
    return null;
  }
  const next = asWithdrawTransactionToApprove(transaction);
  const nested = [...(next.nestedTransactions ?? [])];
  if (!nested[0] || !nested[1]) {
    return null;
  }
  nested[0] = {
    ...nested[0],
    data: update.withdrawData,
  };
  nested[1] = {
    ...nested[1],
    data: update.transferData,
  };
  next.nestedTransactions = nested;
  return withFundedBatchCalldata(next);
}
