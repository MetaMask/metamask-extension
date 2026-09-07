import { BigNumber } from 'bignumber.js';
import { cloneDeep } from 'lodash';
import { MUSD_DECIMALS } from '@metamask/money-account-utils';
import {
  TransactionStatus,
  updateEIP7702BatchData,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { GetAmountDataResponse } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import type { MoneyPayMessenger } from './pay-context';

const MUSD_UNIT = 10 ** MUSD_DECIMALS;

const latestIntentByTransactionId = new Map<string, number>();

/**
 * Parses a human-readable mUSD amount into base units. Returns `undefined`
 * for zero, negative, or non-numeric input so callers can skip a commit
 * rather than encoding a no-op vault call.
 *
 * Sub-base-unit fractions round with `roundingMode` (default
 * `BigNumber.ROUND_UP`) so vault calls never under-deliver relative to the
 * typed amount. Use `ROUND_DOWN` when the amount must not exceed a known
 * balance (e.g. Max against withdrawable funds).
 *
 * @param amountHuman - Exact human-readable mUSD amount.
 * @param roundingMode - BigNumber rounding mode applied after scaling.
 * @returns The amount in mUSD base units, or `undefined` when unusable.
 */
export function parseMusdHumanAmount(
  amountHuman: string,
  roundingMode: number = BigNumber.ROUND_UP,
): bigint | undefined {
  // BigNumber is configured to throw on non-numeric input in this repo.
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

/**
 * Hex-encodes an mUSD base-unit amount for `requiredAssets`.
 *
 * @param amount - Amount in mUSD base units.
 * @returns The amount as hex.
 */
export function toMusdAmountHex(amount: bigint): Hex {
  return `0x${amount.toString(16)}` as Hex;
}

/**
 * Starts an amount-commit intent for a transaction. Later typing wins:
 * `isCurrent()` is false once a newer intent has started for the same id.
 *
 * @param transactionId - Id of the transaction being updated.
 * @returns A function that is true only while this intent is still latest.
 */
export function beginAmountCommit(transactionId: string): () => boolean {
  const intent = (latestIntentByTransactionId.get(transactionId) ?? 0) + 1;
  latestIntentByTransactionId.set(transactionId, intent);
  return () => latestIntentByTransactionId.get(transactionId) === intent;
}

/**
 * Removes the intent entry for `transactionId` only when `isCurrent` still
 * owns it. A superseded commit must not delete a newer intent.
 *
 * @param transactionId - Id whose intent entry may be cleared.
 * @param isCurrent - Predicate from the matching {@link beginAmountCommit}.
 */
export function clearAmountCommitIfCurrent(
  transactionId: string,
  isCurrent: () => boolean,
): void {
  if (isCurrent()) {
    latestIntentByTransactionId.delete(transactionId);
  }
}

/**
 * Drops a transaction's intent entry when it leaves the unapproved set (or
 * is otherwise gone). Safe to call for unknown ids.
 *
 * @param transactionId - Id whose intent entry should be removed.
 */
export function clearAmountCommit(transactionId: string): void {
  latestIntentByTransactionId.delete(transactionId);
}

/**
 * Removes intent entries for transactions that are gone or no longer
 * unapproved so the map does not grow for the lifetime of the background
 * process. Leaves entries alone when the transaction is still unapproved.
 *
 * @param messenger - Messenger used to read TransactionController state.
 */
export function pruneStaleAmountCommits(messenger: MoneyPayMessenger): void {
  if (latestIntentByTransactionId.size === 0) {
    return;
  }

  const { transactions } = messenger.call('TransactionController:getState');
  const transactionsById = new Map(
    transactions.map((transaction) => [transaction.id, transaction]),
  );

  for (const transactionId of latestIntentByTransactionId.keys()) {
    const transaction = transactionsById.get(transactionId);
    if (!transaction || transaction.status !== TransactionStatus.unapproved) {
      latestIntentByTransactionId.delete(transactionId);
    }
  }
}

/**
 * Reads a transaction from TransactionController state by id.
 *
 * @param messenger - Messenger used to read TransactionController state.
 * @param transactionId - Id of the transaction to find.
 * @returns The transaction metadata, or `undefined` if it is gone.
 */
export function getTransactionMeta(
  messenger: MoneyPayMessenger,
  transactionId: string,
): TransactionMeta | undefined {
  const { transactions } = messenger.call('TransactionController:getState');
  return transactions.find((transaction) => transaction.id === transactionId);
}

/**
 * Commits Money Account pay updates onto the live transaction: nested
 * calldata (when provided), regenerated parent EIP-7702 batch
 * `txParams.data`, and optionally `requiredAssets[0].amount`.
 *
 * An empty `updates` array is intentional for the deposit path that writes
 * `requiredAssets` before vault encoding finishes — it still regenerates
 * nothing nested, but updates the required amount so Pay can requote.
 *
 * Pay requotes when `txParams.data` changes; nested-only writes would leave
 * Relay skip-embedding vault calls because parent data stayed empty.
 * Re-reads state first so a concurrent commit cannot clobber unrelated
 * fields from a stale copy.
 *
 * @param messenger - Messenger used to read and write the transaction.
 * @param transactionId - Id of the transaction to update.
 * @param updates - Nested calldata updates keyed by index.
 * @param note - TransactionController history note.
 * @param requiredAssetAmount - Optional new `requiredAssets[0].amount`.
 */
export function commitTransactionPayUpdates(
  messenger: MoneyPayMessenger,
  transactionId: string,
  updates: GetAmountDataResponse['updates'],
  note: string,
  requiredAssetAmount?: Hex,
): void {
  const transaction = getTransactionMeta(messenger, transactionId);
  if (!transaction) {
    clearAmountCommit(transactionId);
    return;
  }

  const nextTransaction = cloneDeep(transaction);
  applyNestedAndParentCalldata(nextTransaction, updates);

  if (
    requiredAssetAmount !== undefined &&
    nextTransaction.requiredAssets?.[0]
  ) {
    nextTransaction.requiredAssets[0].amount = requiredAssetAmount;
  }

  messenger.call(
    'TransactionController:updateTransaction',
    nextTransaction,
    note,
  );
}

/**
 * Applies nested calldata updates and, when the batch has a `from`,
 * regenerates parent EIP-7702 execute() data so Pay sees a non-empty
 * `txParams.data` and embeds the vault calls in the Relay quote.
 *
 * @param transaction - Transaction to mutate.
 * @param updates - Nested calldata updates keyed by index.
 */
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
