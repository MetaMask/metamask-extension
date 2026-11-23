import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';

import { selectTransactionPayEvmAccountOverrideByTransactionId } from '../../../../selectors/transactionPayController';
import type { TransactionPayAccountsState } from '../../../../selectors/transactionPayController';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

/**
 * Address of the funding account override for the current confirmation, when
 * set via the "From" account selector on money-account deposit flows. Only an
 * EVM override changes the EVM account.
 */
export function useTransactionAccountOverride(): Hex | undefined {
  const transactionMeta = useTransactionMetadataRequest();
  const transactionId = transactionMeta.id;

  return useSelector((state: TransactionPayAccountsState) =>
    selectTransactionPayEvmAccountOverrideByTransactionId(state, transactionId),
  );
}
