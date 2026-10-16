import { BigNumber } from 'bignumber.js';
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
 * Commits Pay updates onto the live transaction: nested calldata (when
 * provided), regenerated parent EIP-7702 batch `txParams.data`, and
 * optionally `requiredAssets[0].amount`.
 *
 * Pay requotes when `txParams.data` or `requiredAssets` changes. A required
 * amount written before any nested calldata exists quotes the empty batch.
 * Callers pass the encoded calls and the amount in one commit. Nested-only
 * writes would leave Relay skip-embedding those calls because parent data
 * stayed empty.
 * Re-reads state first so a concurrent commit cannot clobber unrelated
 * fields from a stale copy.
 *
 * @param messenger - Messenger used to read and write the transaction.
 * @param transactionId - Id of the transaction to update.
 * @param updates - Nested calldata updates keyed by index.
 * @param note - TransactionController history note.
 * @param requiredAssetAmount - Optional new `requiredAssets[0].amount`.
 * @returns Whether transaction metadata was written. Unchanged calldata and
 * required amount are left alone so Pay does not quote the same batch again.
 */
export function commitTransactionPayUpdates(
  messenger: MoneyPayMessenger,
  transactionId: string,
  updates: GetAmountDataResponse['updates'],
  note: string,
  requiredAssetAmount?: Hex,
): boolean {
  const transaction = getTransactionMeta(messenger, transactionId);
  if (!transaction) {
    clearAmountCommit(transactionId);
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

  // Gas, simulation, and security results describe the previous calldata.
  // Drop them in this same write so they are not shown against the new amount.
  clearAmountDerivedMetadata(nextTransaction);

  messenger.call(
    'TransactionController:updateTransaction',
    nextTransaction,
    note,
  );
  return true;
}

/**
 * Whether the live transaction already has this calldata and required amount.
 * An empty parent batch still needs a write so Pay embeds the nested calls.
 *
 * @param transaction - Transaction currently stored.
 * @param updates - Nested calldata updates keyed by index.
 * @param requiredAssetAmount - Optional new `requiredAssets[0].amount`.
 * @returns Whether committing would not change quote inputs.
 */
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

/**
 * Removes confirmation metadata that was produced for the previous amount.
 * A receipt revert is an on-chain result and stays.
 *
 * @param transaction - Transaction draft to clear.
 */
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

/**
 * Applies nested calldata updates and, when the batch has a `from`,
 * regenerates parent EIP-7702 execute() data so Pay sees a non-empty
 * `txParams.data` and embeds the nested calls in the Relay quote.
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
