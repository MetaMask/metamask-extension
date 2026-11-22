import { toChecksumHexAddress } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { sumHexes } from '../../../../../../shared/lib/conversion.utils';
import { hasMonadReserveBalanceViolation } from '../../../../../../shared/lib/monad-reserve-balance';
import { getAccountTrackerControllerAccountsByChainId } from '../../../../../../shared/lib/selectors/assets-migration';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionMetadataRequestOptional } from '../../transactions/useTransactionMetadataRequest';

const ZERO_HEX_FALLBACK = '0x0';

export function useIsMonadReserveViolation(): boolean {
  const { transactionMetadataRequestOverride } =
    useConfirmContext<TransactionMeta>();
  const transactionMetadataRequest = useTransactionMetadataRequestOptional();
  const currentConfirmation =
    transactionMetadataRequestOverride ?? transactionMetadataRequest;
  const {
    chainId,
    simulationData,
    simulationFails,
    delegationAddress,
    txParams: { value = ZERO_HEX_FALLBACK, from: fromAddress = '' } = {},
  } = currentConfirmation ?? {};

  const batchTransactionValues =
    currentConfirmation?.nestedTransactions?.map(
      (transaction) => (transaction.value as Hex) ?? ZERO_HEX_FALLBACK,
    ) ?? [];

  const accountsByChainId = useSelector(
    getAccountTrackerControllerAccountsByChainId,
  );
  const balance =
    chainId && fromAddress
      ? accountsByChainId?.[chainId]?.[toChecksumHexAddress(fromAddress)]
          ?.balance
      : undefined;

  const totalValue = sumHexes(value, ...batchTransactionValues);

  return useMemo(
    () =>
      hasMonadReserveBalanceViolation({
        chainId,
        balance,
        value: totalValue,
        isDelegatedAccount: Boolean(delegationAddress),
        simulationData,
        simulationFails,
      }),
    [
      balance,
      chainId,
      delegationAddress,
      simulationData,
      simulationFails,
      totalValue,
    ],
  );
}
