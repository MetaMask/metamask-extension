import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';

import {
  selectBlockedPayTokens,
  type BlockedPayTokensListConfig,
} from '../../selectors/feature-flags';
import { useConfirmContext } from '../../context/confirm';

/**
 * MM Pay token blocklist for the current confirmation, resolved from the
 * `confirmations_pay_tokens` LaunchDarkly flag (with per-transaction overrides).
 */
export function useTransactionPayBlockedTokens(): BlockedPayTokensListConfig {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionType = currentConfirmation?.type;

  return useSelector((state) => selectBlockedPayTokens(state, transactionType));
}
