import type { Hex } from '@metamask/utils';

/**
 * Encoded nested withdraw + transfer calldata returned by a Money Account
 * amount commit. Shared across the background encoder and the UI confirm
 * bridge so the contract cannot drift.
 */
export type MoneyAccountWithdrawAmountUpdate = {
  transactionData?: Hex;
  transferData: Hex;
  withdrawData: Hex;
};
