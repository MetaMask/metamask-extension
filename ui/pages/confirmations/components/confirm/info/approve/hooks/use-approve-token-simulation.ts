import { TransactionMeta } from '@metamask/transaction-controller';
import { isHexString } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { isBoolean } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import { SPENDING_CAP_UNLIMITED_MSG } from '../../../../../constants';
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
      return 0;
    }

    const paramIndex = value.data[0].params.findIndex(
      (param) =>
        param.value !== undefined &&
        !isHexString(param.value) &&
        param.value.length === undefined &&
        !isBoolean(param.value),
    );
    if (paramIndex === -1) {
      return 0;
    }

    return new BigNumber(value.data[0].params[paramIndex].value.toString())
      .dividedBy(new BigNumber(10).pow(Number(decimals)))
      .toNumber();
  }, [value, decimals]);

  const formattedSpendingCap = useMemo(() => {
    return isNFT
      ? decodedSpendingCap
      : new Intl.NumberFormat(locale).format(decodedSpendingCap);
  }, [decodedSpendingCap, isNFT, locale]);

  const spendingCap = useMemo(() => {
    if (!isNFT && isSpendingCapUnlimited(decodedSpendingCap)) {
      return SPENDING_CAP_UNLIMITED_MSG;
    }
    const tokenPrefix = isNFT ? '#' : '';
    return `${tokenPrefix}${formattedSpendingCap}`;
  }, [decodedSpendingCap, formattedSpendingCap, isNFT]);

  return {
    spendingCap,
    formattedSpendingCap,
    value,
    pending: pending || isNFTPending,
  };
};
