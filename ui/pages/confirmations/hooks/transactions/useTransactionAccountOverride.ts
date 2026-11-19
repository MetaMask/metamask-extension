import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';

import { selectTransactionPayAccountOverrideByTransactionId } from '../../../../selectors/transactionPayController';
import type { TransactionPayState } from '../../../../selectors/transactionPayController';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

/**
 * Funding account override for the current confirmation, when set via the
 * "From" account selector on money-account deposit flows.
 */
export function useTransactionAccountOverride(): Hex | undefined {
  const transactionMeta = useTransactionMetadataRequest();
  const transactionId = transactionMeta.id;

  return useSelector((state: TransactionPayState) =>
    selectTransactionPayAccountOverrideByTransactionId(state, transactionId),
  );
}
