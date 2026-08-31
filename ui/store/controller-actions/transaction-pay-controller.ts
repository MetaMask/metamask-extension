import type { PaymentOverride } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import type { WithdrawAmountCommitResult } from '../../../shared/lib/money/withdraw-amount-commit';
import { submitRequestToBackground } from '../background-connection';

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

/**
 * Prepares and commits a Money Account withdrawal amount in the background:
 * re-encodes the withdraw + transfer calldata for the new amount, with the
 * redeemed mUSD forwarded to the Pay account override (the account shown on
 * the confirmation) or, when unset, the currently selected account.
 * Superseded intents resolve `{ didCommit: false }`.
 *
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @param amountHuman - Exact human-readable amount.
 * @returns Whether this intent committed transaction metadata, and the
 * recipient it encoded if so.
 */
export async function updateMoneyAccountWithdrawAmount(
  transactionId: string,
  amountHuman: string,
): Promise<WithdrawAmountCommitResult> {
  return await submitRequestToBackground('updateMoneyAccountWithdrawAmount', [
    transactionId,
    amountHuman,
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
