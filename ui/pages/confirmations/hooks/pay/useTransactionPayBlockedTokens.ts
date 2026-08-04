import { useSelector } from 'react-redux';

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
  const transactionType = transactionMeta?.type;

  return useSelector((state) => selectBlockedPayTokens(state, transactionType));
}
