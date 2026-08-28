import type { PaymentOverride } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import { submitRequestToBackground } from '../background-connection';

export type MoneyAccountWithdrawAmountUpdate = {
  transactionData?: Hex;
  transferData: Hex;
  withdrawData: Hex;
};

export async function updateTransactionPaymentToken({
  transactionId,
  tokenAddress,
  chainId,
}: {
  transactionId: string;
  tokenAddress: Hex;
  chainId: Hex;
}): Promise<void> {
  return await submitRequestToBackground('updateTransactionPaymentToken', [
    {
      transactionId,
      tokenAddress,
      chainId,
    },
  ]);
}

export async function setPaymentOverride(
  transactionId: string,
  {
    paymentOverride,
    refundTo,
  }: {
    paymentOverride?: PaymentOverride;
    refundTo?: Hex;
  } = {},
): Promise<void> {
  return await submitRequestToBackground('setTransactionPayPaymentOverride', [
    transactionId,
    { paymentOverride, refundTo },
  ]);
}

export async function setIsMaxAmount(
  transactionId: string,
  isMaxAmount: boolean,
  options: { isMoneyAccountDeposit?: boolean } = {},
): Promise<void> {
  return await submitRequestToBackground('setTransactionPayIsMaxAmount', [
    transactionId,
    isMaxAmount,
    options,
  ]);
}

/**
 * Creates the placeholder Money Account deposit batch in the background and
 * returns the created transaction's id for confirmation navigation. The
 * caller generates and supplies the batch id so the deposit intent can be
 * recorded against it before this call.
 *
 * @param batchId - Caller-generated batch id.
 * @param accountOverride - Currently selected EVM account, used as the
 * default funding account on the confirmation (`txParams.from` is the
 * money account, which executes the batch).
 * @returns The created transaction id and the batch id.
 */
export async function createMoneyAccountDepositTransaction(
  batchId: Hex,
  accountOverride: Hex,
): Promise<{ transactionId: string; batchId: Hex }> {
  return await submitRequestToBackground(
    'createMoneyAccountDepositTransaction',
    [batchId, accountOverride],
  );
}

/**
 * Creates the placeholder Money Account withdrawal batch in the background
 * and returns the created transaction's id for confirmation navigation.
 *
 * @param accountOverride - Currently selected EVM account, used as the
 * default destination on the confirmation (`txParams.from` is the money
 * account, which executes the batch).
 * @returns The created transaction id and the batch id.
 */
export async function createMoneyAccountWithdrawTransaction(
  accountOverride: Hex,
): Promise<{
  transactionId: string;
  batchId: Hex;
}> {
  return await submitRequestToBackground(
    'createMoneyAccountWithdrawTransaction',
    [accountOverride],
  );
}

const lastWithdrawAmountByTransactionId = new Map<string, string>();
const lastWithdrawAmountListeners = new Set<() => void>();

/**
 * Last human-readable withdraw amount dispatched for this transaction.
 * Confirm uses this so Send can re-encode even if the confirmation UI still
 * holds the unencoded placeholder. The footer uses it to enable Send when
 * TPC has no required token / quote totals (direct withdraws).
 *
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @returns The last amount, if any update has been dispatched.
 */
export function getLastMoneyAccountWithdrawAmount(
  transactionId: string,
): string | undefined {
  return lastWithdrawAmountByTransactionId.get(transactionId);
}

/**
 * Record the typed withdraw amount immediately so Send can encode before the
 * debounced background write finishes.
 *
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable amount.
 */
export function setLastMoneyAccountWithdrawAmount(
  transactionId: string,
  amountHuman: string,
): void {
  lastWithdrawAmountByTransactionId.set(transactionId, amountHuman);
  lastWithdrawAmountListeners.forEach((listener) => listener());
}

/**
 * Subscribe to last-withdraw-amount writes. Used by
 * `useLastMoneyAccountWithdrawAmount`.
 *
 * @param onStoreChange - Listener invoked after any amount is recorded.
 * @returns Unsubscribe function.
 */
export function subscribeLastMoneyAccountWithdrawAmount(
  onStoreChange: () => void,
): () => void {
  lastWithdrawAmountListeners.add(onStoreChange);
  return () => {
    lastWithdrawAmountListeners.delete(onStoreChange);
  };
}

/**
 * Encodes and commits a Money Account withdrawal amount in the background.
 * Confirm approves the returned transaction so Send does not use the empty
 * placeholder. Superseded or zero-amount intents resolve `false`.
 *
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable amount.
 * @param recipientOverride - Optional EVM address to receive the redeemed mUSD.
 * @returns The encoded nested calldata, or `false` if this intent did not
 * commit.
 */
export async function updateMoneyAccountWithdrawAmount(
  transactionId: string,
  amountHuman: string,
  recipientOverride?: Hex,
): Promise<MoneyAccountWithdrawAmountUpdate | false> {
  setLastMoneyAccountWithdrawAmount(transactionId, amountHuman);
  return await submitRequestToBackground('updateMoneyAccountWithdrawAmount', [
    transactionId,
    amountHuman,
    recipientOverride,
  ]);
}

/**
 * Prepares and commits a Money Account deposit amount in the background:
 * re-encodes the nested approve + deposit calldata for the new amount and
 * writes `requiredAssets` so TransactionPayController can fetch quotes.
 * Superseded intents resolve `false`.
 *
 * @param transactionId - Id of the Money Account deposit transaction.
 * @param amountHuman - Exact human-readable amount.
 * @returns Whether this intent committed transaction metadata.
 */
export async function updateMoneyAccountDepositAmount(
  transactionId: string,
  amountHuman: string,
): Promise<boolean> {
  return await submitRequestToBackground('updateMoneyAccountDepositAmount', [
    transactionId,
    amountHuman,
  ]);
}

export async function setPostQuote(
  transactionId: string,
  options: { isHyperliquidSource?: boolean } = {},
): Promise<void> {
  return await submitRequestToBackground('setTransactionPayPostQuote', [
    transactionId,
    options,
  ]);
}

export async function setAccountOverride(
  transactionId: string,
  accountOverride: Hex,
): Promise<void> {
  return await submitRequestToBackground('setTransactionPayAccountOverride', [
    transactionId,
    accountOverride,
  ]);
}
