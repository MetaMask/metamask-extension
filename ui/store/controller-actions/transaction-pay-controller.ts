import type { PaymentOverride } from '@metamask/transaction-pay-controller';
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

export async function setAccountOverride(
  transactionId: string,
  accountOverride: Hex,
): Promise<void> {
  return await submitRequestToBackground('setTransactionPayAccountOverride', [
    transactionId,
    accountOverride,
  ]);
}
