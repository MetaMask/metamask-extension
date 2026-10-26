import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  getMoneyTransactionFeeUsd,
  getMoneyTransactionTotalUsd,
  isMoneyNetworkFeePaidByMetaMask,
} from '../../pages/money/utils/money-transaction-fee';
import { getUSDConversionRateByChainId } from '../../selectors/selectors';

/**
 * Resolves the USD fee and total for a Money transaction.
 *
 * @param tx - Transaction metadata to inspect.
 * @returns The fee and total in USD when available, plus whether the network
 * fee is MetaMask-sponsored.
 */
export function useMoneyTransactionFee(tx: TransactionMeta | undefined): {
  feeUsd: number | undefined;
  totalUsd: number | undefined;
  isNetworkFeePaidByMetaMask: boolean;
} {
  const nativeUsdRate = useSelector((state) =>
    tx ? getUSDConversionRateByChainId(tx.chainId)(state) : undefined,
  );

  return useMemo(
    () => ({
      feeUsd: tx ? getMoneyTransactionFeeUsd(tx, nativeUsdRate) : undefined,
      totalUsd: tx ? getMoneyTransactionTotalUsd(tx) : undefined,
      isNetworkFeePaidByMetaMask: tx
        ? isMoneyNetworkFeePaidByMetaMask(tx)
        : false,
    }),
    [nativeUsdRate, tx],
  );
}
