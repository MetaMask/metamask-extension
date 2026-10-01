import type { Hex } from '@metamask/utils';

import { isPostQuoteWithdrawTransaction } from '../../../../../shared/lib/transactions.utils';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';
import { useTransactionMetadataRequestOptional } from './useTransactionMetadataRequest';

/**
 * Address of the account that funds the transaction and signs its funding
 * legs on-device.
 *
 * Most flows use `txParams.from`. Money Account deposits are signed by the
 * money account but funded by the account in `accountOverride`. Post-quote
 * withdraws keep `from` because their override is only the recipient.
 *
 * Mirrors mobile `useTransactionPayingAccount`.
 */
export function useTransactionPayingAccount(): Hex | undefined {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const accountOverride = useTransactionAccountOverride();

  const from = transactionMeta?.txParams?.from as Hex | undefined;

  if (isPostQuoteWithdrawTransaction(transactionMeta)) {
    return from;
  }

  return accountOverride ?? from;
}
