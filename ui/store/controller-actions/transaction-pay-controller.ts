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

export async function setPostQuote(
  transactionId: string,
  options: { isHyperliquidSource?: boolean } = {},
): Promise<void> {
  return await submitRequestToBackground('setTransactionPayPostQuote', [
    transactionId,
    options,
  ]);
}

export async function setTransactionPayConfig(
  transactionId: string,
  options: { isPostQuote?: boolean; accountOverride?: string | null },
): Promise<void> {
  return await submitRequestToBackground('setTransactionPayConfig', [
    transactionId,
    options,
  ]);
}
