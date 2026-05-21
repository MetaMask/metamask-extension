import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { TokenAmount } from '../types';

type ValueTransfer = NonNullable<
  V1TransactionByHashResponse['valueTransfers']
>[number];

export function getTokenAmountFromTransfer(
  transfer: ValueTransfer | undefined,
  direction: TokenAmount['direction'],
) {
  if (!transfer?.symbol && transfer?.amount === undefined) {
    return undefined;
  }

  return {
    direction,
    ...(transfer.amount === undefined
      ? {}
      : { amount: String(transfer.amount) }),
    ...(transfer.decimal === undefined ? {} : { decimals: transfer.decimal }),
    ...(transfer.symbol ? { symbol: transfer.symbol } : {}),
  };
}
