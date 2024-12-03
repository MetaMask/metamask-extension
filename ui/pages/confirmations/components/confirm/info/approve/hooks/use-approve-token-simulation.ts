import { TransactionMeta } from '@metamask/transaction-controller';
import { isHexString } from '@metamask/utils';
import { isBoolean } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
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

  const formattedSpendingCap = useMemo(() => {
    // formatting coerces small numbers to 0
    return isNFT || parseInt(decodedSpendingCap, 10) < 1
      ? decodedSpendingCap
      : new Intl.NumberFormat(locale).format(parseInt(decodedSpendingCap, 10));
  }, [decodedSpendingCap, isNFT, locale]);

  const spendingCap = useMemo(() => {
    if (!isNFT && isSpendingCapUnlimited(parseInt(decodedSpendingCap, 10))) {
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
