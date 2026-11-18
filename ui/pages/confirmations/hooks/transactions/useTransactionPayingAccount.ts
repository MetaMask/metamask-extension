import type { Hex } from '@metamask/utils';

import { getTransactionPayingAccount } from '../../../../../shared/lib/transactions.utils';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';
import { useTransactionMetadataRequestOptional } from './useTransactionMetadataRequest';

/**
 * Address of the account that funds the current transaction and signs its
 * funding legs on-device. See `getTransactionPayingAccount`.
 *
 * Mirrors mobile `useTransactionPayingAccount`.
 */
export function useTransactionPayingAccount(): Hex | undefined {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const accountOverride = useTransactionAccountOverride();

  return getTransactionPayingAccount(transactionMeta, accountOverride);
}
