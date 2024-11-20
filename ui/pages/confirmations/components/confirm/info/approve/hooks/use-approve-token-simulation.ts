import { TransactionMeta } from '@metamask/transaction-controller';
import { isHexString } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { isBoolean } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import { formatAmount } from '../../../../simulation-details/formatAmount';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { useIsNFT } from './use-is-nft';

const UNLIMITED_THRESHOLD = 10 ** 15;

function isSpendingCapUnlimited(decodedSpendingCap: number) {
  return decodedSpendingCap >= UNLIMITED_THRESHOLD;
}

export const useApproveTokenSimulation = (
  transactionMeta: TransactionMeta,
  decimals: string,
) => {
  const locale = useSelector(getIntlLocale);
  const { isNFT, pending: isNFTPending } = useIsNFT(transactionMeta);
  const decodedResponse = useDecodedTransactionData();
  const { value, pending } = decodedResponse;

  const decodedSpendingCap = useMemo(() => {
    if (!value) {
      return '0';
    }

    const paramIndex = value.data[0].params.findIndex(
      (param) =>
        param.value !== undefined &&
        !isHexString(param.value) &&
        param.value.length === undefined &&
        !isBoolean(param.value),
    );
    if (paramIndex === -1) {
      return '0';
    }

    return calcTokenAmount(
      value.data[0].params[paramIndex].value,
      Number(decimals),
    ).toFixed();
  }, [value, decimals]);

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
    pending: pending || isNFTPending,
  };
};
