import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { hasTransactionType } from './transactions.utils';

/**
 * Capabilities of the account and chain used to decide gas fee sponsorship.
 */
export type GasFeeSponsorshipCapabilities = {
  /**
   * Whether a sponsored publisher supports the account and chain: Smart
   * Transactions with sendBundle, or the EIP-7702 relay.
   */
  isGaslessSupported: boolean;

  /** Whether the user opted out of gas sponsorship on the transaction chain. */
  isOptedOut: boolean;
};

/**
 * Transaction facts that make gas fee sponsorship possible.
 *
 * @param transaction - The transaction to evaluate.
 * @returns Whether sponsorship is available or required, and the transaction is
 * not a revoke delegation.
 */
export function isGasFeeSponsorshipPossible(
  transaction: TransactionMeta | undefined,
): boolean {
  if (!transaction || transaction.type === TransactionType.revokeDelegation) {
    return false;
  }

  return Boolean(
    transaction.forceIsGasFeeSponsored ||
    transaction.isGasFeeSponsoredAvailable,
  );
}

/**
 * Whether the transaction requires sponsorship to be published.
 *
 * @param transaction - The transaction to evaluate.
 * @returns True for Money Account withdrawals.
 */
export function isGasFeeSponsorshipRequired(
  transaction: TransactionMeta | undefined,
): boolean {
  return hasTransactionType(transaction, [
    TransactionType.moneyAccountWithdraw,
  ]);
}

/**
 * Whether the transaction executes from a Money Account, whose keyring can
 * always publish sponsored transactions.
 *
 * @param transaction - The transaction to evaluate.
 * @returns True for Money Account deposits and withdrawals.
 */
export function isMoneyAccountSponsorship(
  transaction: TransactionMeta | undefined,
): boolean {
  return hasTransactionType(transaction, [
    TransactionType.moneyAccountDeposit,
    TransactionType.moneyAccountWithdraw,
  ]);
}

/**
 * Single definition of whether MetaMask sponsors the gas fee of a transaction.
 *
 * Shared by the background sponsorship function and the confirmation UI.
 * Sponsorship requires availability (from simulation or required by the
 * transaction creator), no user opt-out, and a supported publisher: Smart
 * Transactions with sendBundle, or the EIP-7702 relay.
 *
 * @param transaction - The transaction to evaluate.
 * @param capabilities - Account and chain capabilities.
 * @returns Whether the gas fee is sponsored.
 */
export function getIsGasFeeSponsored(
  transaction: TransactionMeta | undefined,
  capabilities: GasFeeSponsorshipCapabilities,
): boolean {
  if (!isGasFeeSponsorshipPossible(transaction) || capabilities.isOptedOut) {
    return false;
  }

  if (isMoneyAccountSponsorship(transaction)) {
    return true;
  }

  return capabilities.isGaslessSupported;
}
