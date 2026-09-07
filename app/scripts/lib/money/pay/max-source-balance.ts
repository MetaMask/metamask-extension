import { BigNumber } from 'bignumber.js';

/**
 * Funding-account pay-token balances recorded by the UI when Max is armed,
 * keyed by transaction id.
 *
 * TransactionPayController resolves a Max source amount from its own
 * `paymentToken` snapshot, which is read from asset state when the pay token is
 * selected. For money-account deposits that snapshot is regularly `0`: the
 * transaction's `from` is the money account, the funding balance belongs to the
 * selected EOA, and the deposit confirmation opens before that balance lands.
 * The controller does refresh the snapshot over RPC at quote time, but its
 * source-amount recompute only triggers on pay-token address / chain changes,
 * so a balance that arrives late never rebuilds the amount and Relay is asked
 * to bridge `0`.
 *
 * The UI resolves the same balance reliably (live read, falling back to the
 * snapshot), so it hands the value over when it arms Max and the `getBalance`
 * callback returns it as the source amount.
 */
const balanceRawByTransactionId = new Map<string, string>();

/**
 * Cap on retained entries. Ids are unique per confirmation and entries are
 * cleared when Max is turned off, so this only bounds the rejected /
 * abandoned-confirmation tail.
 */
const MAX_ENTRIES = 10;

/**
 * Records the funding-account balance to use as the Max source amount.
 *
 * @param transactionId - Confirmation transaction id.
 * @param balanceRaw - Funding-account pay-token balance in base units.
 */
export function setMaxSourceBalance(
  transactionId: string,
  balanceRaw: string,
): void {
  if (!isPositiveRaw(balanceRaw)) {
    balanceRawByTransactionId.delete(transactionId);
    return;
  }

  balanceRawByTransactionId.set(transactionId, balanceRaw);

  while (balanceRawByTransactionId.size > MAX_ENTRIES) {
    const oldest = balanceRawByTransactionId.keys().next().value as string;
    balanceRawByTransactionId.delete(oldest);
  }
}

/**
 * Drops any balance recorded for a transaction.
 *
 * @param transactionId - Confirmation transaction id.
 */
export function clearMaxSourceBalance(transactionId: string): void {
  balanceRawByTransactionId.delete(transactionId);
}

/**
 * Returns the balance recorded for a transaction, if any.
 *
 * @param transactionId - Confirmation transaction id.
 * @returns The balance in base units, or `undefined` when none was recorded.
 */
export function getMaxSourceBalance(transactionId: string): string | undefined {
  return balanceRawByTransactionId.get(transactionId);
}

function isPositiveRaw(balanceRaw: string): boolean {
  let value: BigNumber;

  try {
    value = new BigNumber(balanceRaw);
  } catch {
    return false;
  }

  return value.isFinite() && value.gt(0);
}
