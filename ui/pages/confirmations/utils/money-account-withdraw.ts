import { MUSD_DECIMALS } from '@metamask/money-account-utils';
import {
  generateEIP7702BatchTransaction,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { cloneDeep } from 'lodash';

import type { MoneyAccountWithdrawAmountUpdate } from '../../../../shared/lib/money/withdraw-amount-commit';
import { parseStandardTokenTransactionData } from '../../../../shared/lib/transaction.utils';

/**
 * ERC-20 `transfer(address,uint256)` 4-byte selector (`keccak256("transfer(address,uint256)").slice(0, 4)`).
 * Used as a cheap early-out before calling the shared ABI parser; amount
 * decoding itself goes through {@link parseStandardTokenTransactionData}.
 */
const TRANSFER_SELECTOR = '0xa9059cbb';

/**
 * Recipient and raw transfer amount decoded from a Money Account withdraw
 * batch's nested `tokenMethodTransfer` call.
 */
export type MoneyAccountWithdrawTransferDetails = {
  recipient?: string;
  amountRaw?: string;
};

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
 * Locates the nested ERC-20 transfer in a Money Account withdraw batch and
 * returns its recipient and raw (base units) amount. Shared by the activity
 * hero and activity-list enrichment so decoding cannot drift.
 *
 * @param transaction - Transaction whose nested calls to inspect.
 * @returns Recipient and/or raw amount when the nested transfer is present.
 */
export function getMoneyAccountWithdrawTransferDetails(
  transaction:
    | {
        nestedTransactions?: { data?: string; type?: string; to?: string }[];
      }
    | undefined,
): MoneyAccountWithdrawTransferDetails {
  const transfer = transaction?.nestedTransactions?.find(
    (nested) => nested.type === TransactionType.tokenMethodTransfer,
  );
  if (!transfer?.data) {
    return {};
  }

  const parsed = parseStandardTokenTransactionData(transfer.data);
  const recipient = parsed?.args?._to ?? parsed?.args?.to;
  const amount = parsed?.args?._value ?? parsed?.args?.value ?? parsed?.args?.[1];

  let amountRaw: string | undefined;
  if (amount !== undefined && amount !== null) {
    try {
      amountRaw = BigInt(amount.toString()).toString();
    } catch {
      amountRaw = undefined;
    }
  }

  return {
    ...(typeof recipient === 'string' ? { recipient } : {}),
    ...(amountRaw === undefined ? {} : { amountRaw }),
  };
}

/**
 * Reads the raw (base units) amount argument out of `transfer(to, amount)`
 * calldata via the shared ERC-20 ABI parser.
 *
 * @param data - Calldata expected to be an ERC-20 transfer.
 * @returns The raw amount as a decimal string, or `undefined` when the
 * calldata is not a decodable transfer.
 */
export function getTransferAmountRawFromData(
  data: string | undefined,
): string | undefined {
  if (!data || !data.toLowerCase().startsWith(TRANSFER_SELECTOR)) {
    return undefined;
  }

  const parsed = parseStandardTokenTransactionData(data);
  if (parsed?.name !== 'transfer') {
    return undefined;
  }

  const amount = parsed.args?._value ?? parsed.args?.value ?? parsed.args?.[1];
  if (amount === undefined || amount === null) {
    return undefined;
  }

  try {
    return BigInt(amount.toString()).toString();
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
 * Converts a human-readable mUSD amount to base units for calldata comparison.
 * Uses the same `ROUND_UP` rules as the background amount commit so a matching
 * typed amount is not treated as stale.
 *
 * @param amountHuman - Exact human-readable mUSD amount.
 * @returns Raw amount as a decimal string, or `undefined` when invalid.
 */
function musdHumanToRaw(amountHuman: string): string | undefined {
  let value: BigNumber;
  try {
    value = new BigNumber(amountHuman);
  } catch {
    return undefined;
  }

  if (!value.isFinite() || value.lte(0)) {
    return undefined;
  }

  const raw = value
    .times(10 ** MUSD_DECIMALS)
    .round(0, BigNumber.ROUND_UP);
  if (raw.lte(0)) {
    return undefined;
  }

  return raw.toString(10);
}

/**
 * Whether funded nested withdraw calldata already encodes `amountHuman`.
 * The footer enables Send from the latest typed amount immediately, while the
 * store can still hold a previous encode — confirm must not treat a stale
 * funded batch as ready.
 *
 * @param transaction - Transaction whose nested transfer to inspect.
 * @param amountHuman - Latest typed human-readable mUSD amount.
 * @returns Whether the nested transfer amount matches `amountHuman`.
 */
export function doesWithdrawCalldataMatchAmount(
  transaction: TransactionMeta | undefined,
  amountHuman: string | undefined,
): boolean {
  if (!amountHuman || !hasFundedWithdrawCalldata(transaction)) {
    return false;
  }
  const expectedRaw = musdHumanToRaw(amountHuman);
  if (!expectedRaw) {
    return false;
  }
  const encodedRaw = getTransferAmountRawFromData(
    transaction?.nestedTransactions?.[1]?.data,
  );
  return encodedRaw === expectedRaw;
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
