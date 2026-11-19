import {
  hasTransactionType,
  type TransactionMeta,
  type TransactionType,
} from '@metamask/transaction-controller';
import { PAY_EXTENDED_FEATURE_FLAG } from '../../../../shared/lib/transaction/pay-prefill';

export const PAY_DEPOSIT_LIMITS_DEFAULT: Record<string, number> = {};

type PayExtendedFeatureFlag = {
  depositLimit?: Record<string, number>;
};

type FeatureFlagSource = {
  remoteFeatureFlags?: Record<string, unknown>;
};

/**
 * Reads `confirmations_pay_extended.depositLimit` as a per-transaction-type USD
 * map. Missing or invalid values fall back to an empty map (no limits).
 *
 * @param source - An object holding the remote feature flags.
 * @returns Deposit limits keyed by transaction type.
 */
export function getDepositLimits(
  source: FeatureFlagSource,
): Record<string, number> {
  const flag = source.remoteFeatureFlags?.[PAY_EXTENDED_FEATURE_FLAG] as
    | PayExtendedFeatureFlag
    | undefined;

  const depositLimit = flag?.depositLimit;
  if (!depositLimit || typeof depositLimit !== 'object') {
    return PAY_DEPOSIT_LIMITS_DEFAULT;
  }

  return depositLimit;
}

/**
 * Resolves the USD deposit limit for a transaction from a limits map, matching
 * the transaction type (including nested batch types).
 *
 * @param depositLimits - Per-transaction-type USD limits.
 * @param transactionMeta - The confirmation transaction metadata.
 * @returns The matching limit, or undefined when none applies.
 */
export function getDepositLimitForTransaction(
  depositLimits: Record<string, number>,
  transactionMeta?: TransactionMeta,
): number | undefined {
  for (const [type, limit] of Object.entries(depositLimits)) {
    if (hasTransactionType(transactionMeta, [type as TransactionType])) {
      return limit;
    }
  }

  return undefined;
}
