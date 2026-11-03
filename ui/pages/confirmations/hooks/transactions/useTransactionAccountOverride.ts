import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';

import { getEvmAccountOverride } from '../../../../../shared/lib/transaction/pay-token';
import { selectTransactionPayAccountOverrideByTransactionId } from '../../../../selectors/transactionPayController';
import type { TransactionPayState } from '../../../../selectors/transactionPayController';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

/**
 * Funding account override for the current confirmation, when set via the
 * "From" account selector on money-account deposit flows. Only an EVM
 * override changes the EVM account.
 */
export function useTransactionAccountOverride(): Hex | undefined {
  const transactionMeta = useTransactionMetadataRequest();
  const transactionId = transactionMeta.id;

  const accountOverride = useSelector((state: TransactionPayState) =>
    selectTransactionPayAccountOverrideByTransactionId(state, transactionId),
  );

  return getEvmAccountOverride(accountOverride);
}
