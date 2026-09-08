import { BigNumber } from 'bignumber.js';

/**
 * Funding-account pay-token balances recorded by the UI when Max is armed,
 * keyed by transaction id and tied to the funding account and pay token.
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
type MaxSourceBalance = {
  accountAddress?: string;
  balanceRaw: string;
  chainId?: string;
  tokenAddress?: string;
};

type MaxSourceBalanceKey = Omit<MaxSourceBalance, 'balanceRaw'> & {
  transactionId: string;
};

const balanceByTransactionId = new Map<string, MaxSourceBalance>();

/**
 * Records the funding-account balance to use as the Max source amount.
 *
 * @param key - Identity of the confirmation, funding account, and pay token.
 * @param balanceRaw - Funding-account pay-token balance in base units.
 */
export function setMaxSourceBalance(
  key: MaxSourceBalanceKey,
  balanceRaw: string,
): void {
  if (!isPositiveRaw(balanceRaw)) {
    balanceByTransactionId.delete(key.transactionId);
    return;
  }

  balanceByTransactionId.set(key.transactionId, {
    accountAddress: normalizeIdentity(key.accountAddress),
    balanceRaw,
    chainId: normalizeIdentity(key.chainId),
    tokenAddress: normalizeIdentity(key.tokenAddress),
  });
}

/**
 * Drops any balance recorded for a transaction.
 *
 * @param transactionId - Confirmation transaction id.
 */
export function clearMaxSourceBalance(transactionId: string): void {
  balanceByTransactionId.delete(transactionId);
}

/**
 * Returns the balance recorded for the same transaction, funding account, and
 * pay token, if any.
 *
 * @param key - Current confirmation, funding account, and pay-token identity.
 * @returns The balance in base units, or `undefined` when none was recorded.
 */
export function getMaxSourceBalance(
  key: MaxSourceBalanceKey,
): string | undefined {
  const recorded = balanceByTransactionId.get(key.transactionId);

  if (
    !recorded ||
    recorded.accountAddress !== normalizeIdentity(key.accountAddress) ||
    recorded.chainId !== normalizeIdentity(key.chainId) ||
    recorded.tokenAddress !== normalizeIdentity(key.tokenAddress)
  ) {
    return undefined;
  }

  return recorded.balanceRaw;
}

/**
 * Clears every recorded balance. Only use from tests.
 */
export function resetMaxSourceBalancesForTests(): void {
  balanceByTransactionId.clear();
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

function normalizeIdentity(value: string | undefined): string | undefined {
  return value?.toLowerCase();
}
