import type { Hex } from '@metamask/utils';
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

export async function setIsMaxAmount(
  transactionId: string,
  isMaxAmount: boolean,
): Promise<void> {
  return await submitRequestToBackground('setTransactionPayIsMaxAmount', [
    transactionId,
    isMaxAmount,
  ]);
}

/**
 * Prepares and commits a Money Account deposit amount in the background:
 * re-encodes the nested approve + deposit calldata for the new amount and
 * writes it into the transaction. Superseded intents resolve `false`.
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
