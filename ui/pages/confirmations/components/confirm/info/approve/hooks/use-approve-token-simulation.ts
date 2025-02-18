import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import { formatAmount } from '../../../../simulation-details/formatAmount';
import { TOKEN_VALUE_UNLIMITED_THRESHOLD } from '../../shared/constants';
import { parseStandardTokenTransactionData } from '../../../../../../../../shared/modules/transaction.utils';
import { useIsNFT } from './use-is-nft';

export function decodeApproveTokenData({
  data,
  decimals,
  to,
}: {
  data?: Hex;
  decimals?: number;
  locale: string;
  to?: Hex;
}) {
  if (!data || !to) {
    return undefined;
  }

  const transactionDescription = parseStandardTokenTransactionData(data);

  if (!transactionDescription) {
    return undefined;
  }

  const parsedArgs = transactionDescription.args;

  const value =
    parsedArgs?._value ?? // ERC-20 - approve
    parsedArgs?.increment; // Fiat Token V2 - increaseAllowance

  if (!value) {
    return undefined;
  }

  return calcTokenAmount(value, decimals ?? 0);
}

export function isSpendingCapUnlimited(decodedSpendingCap: number) {
  return decodedSpendingCap >= TOKEN_VALUE_UNLIMITED_THRESHOLD;
}

export const useApproveTokenSimulation = (
  transactionMeta: TransactionMeta,
  decimals: string | undefined,
) => {
  const locale = useSelector(getIntlLocale);
  const { isNFT, pending: isNFTPending } = useIsNFT(transactionMeta);
  const data = transactionMeta.txParams.data as Hex | undefined;
  const to = transactionMeta.txParams.to as Hex | undefined;
  const decimalsNumber = decimals ? Number(decimals) : 0;

  const value =
    decodeApproveTokenData({
      data,
      decimals: decimalsNumber,
      locale,
      to,
    }) ?? new BigNumber(0);

  const decodedSpendingCap = value.toFixed();

  const tokenPrefix = isNFT ? '#' : '';

  const formattedSpendingCap = useMemo(() => {
    return isNFT
      ? `${tokenPrefix}${decodedSpendingCap}`
      : formatAmount(locale, new BigNumber(decodedSpendingCap));
  }, [decodedSpendingCap, isNFT, locale]);

  const { spendingCap, isUnlimitedSpendingCap } = useMemo(() => {
    if (!isNFT && isSpendingCapUnlimited(parseInt(decodedSpendingCap, 10))) {
      return { spendingCap: decodedSpendingCap, isUnlimitedSpendingCap: true };
    }
    return {
      spendingCap: `${tokenPrefix}${decodedSpendingCap}`,
      isUnlimitedSpendingCap: false,
    };
  }, [decodedSpendingCap, formattedSpendingCap, isNFT]);

  return {
    isUnlimitedSpendingCap,
    spendingCap,
    formattedSpendingCap,
    value,
    pending: isNFTPending,
  };
};
