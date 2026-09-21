import { TransactionType } from '@metamask/transaction-controller';

/**
 * Transaction types that use the Pay flow (TransactionDetailsModal instead of TransactionListItemDetails)
 */
export const PAY_TRANSACTION_TYPES = [
  TransactionType.moneyAccountDeposit,
  TransactionType.moneyAccountWithdraw,
  TransactionType.musdClaim,
  TransactionType.musdConversion,
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
];

/**
 * Pay flows that can never be funded by a hardware wallet account, regardless
 * of feature flags. These flows submit a batch that the hardware device cannot
 * sign, so a hardware account is not a valid funding source.
 */
export const PAY_HARDWARE_BLOCKED_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.moneyAccountDeposit,
  TransactionType.moneyAccountWithdraw,
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
  TransactionType.predictDeposit,
  TransactionType.predictWithdraw,
];

/**
 * Pay flows where hardware funding is blocked only while the
 * `confirmations_pay_hardware` feature flag is off.
 */
export const PAY_HARDWARE_FLAG_GATED_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.musdConversion,
];
