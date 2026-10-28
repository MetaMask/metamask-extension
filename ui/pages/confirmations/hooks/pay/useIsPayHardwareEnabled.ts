import { useSelector } from 'react-redux';

import { selectIsPayHardwareEnabled } from '../../selectors/feature-flags';
import { getConfirmationTransactionType } from '../../utils/confirm';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';

/**
 * Whether hardware wallets may pay for the current MM Pay transaction type.
 *
 * Batched confirmations report `type: batch`, so the pay type is resolved
 * from the nested transactions before reading the per-type flag.
 */
export function useIsPayHardwareEnabled(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const transactionType = getConfirmationTransactionType(transactionMeta);

  return useSelector((state) =>
    selectIsPayHardwareEnabled(state, transactionType),
  );
}
