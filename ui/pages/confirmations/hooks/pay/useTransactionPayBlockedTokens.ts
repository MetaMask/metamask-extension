import { useSelector } from 'react-redux';

import { getTransactionType } from '../../../../../shared/lib/transactions.utils';
import { getMoneyAccountTransactionType } from '../../utils/confirm';
import {
  selectBlockedPayTokens,
  type BlockedPayTokensListConfig,
} from '../../selectors/feature-flags';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';

/**
 * MM Pay token blocklist for the current confirmation, resolved from the
 * `confirmations_pay_tokens` LaunchDarkly flag (with per-transaction overrides).
 */
export function useTransactionPayBlockedTokens(): BlockedPayTokensListConfig {
  const transactionMeta = useTransactionMetadataRequestOptional();
  // Prefer money-account nested type when present — deposit batches are
  // `[approve, deposit]`, so top-level `type` is `batch` and the first nested
  // type is the approve.
  const transactionType =
    getMoneyAccountTransactionType(transactionMeta) ??
    getTransactionType(transactionMeta);

  return useSelector((state) => selectBlockedPayTokens(state, transactionType));
}
