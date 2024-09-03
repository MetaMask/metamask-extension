import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { useIsNFT } from './use-is-nft';

export const UNLIMITED_MSG = 'UNLIMITED MESSAGE';

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

  const decodedSpendingCap = value
    ? new BigNumber(value.data[0].params[1].value)
        .dividedBy(new BigNumber(10).pow(Number(decimals)))
        .toNumber()
    : 0;

  const tokenPrefix = isNFT ? '#' : '';
  const formattedTokenNum = isNFT
    ? decodedSpendingCap
    : new Intl.NumberFormat(locale).format(decodedSpendingCap);

  let tokenAmount;
  if (!isNFT && isSpendingCapUnlimited(decodedSpendingCap)) {
    tokenAmount = UNLIMITED_MSG;
  } else {
    tokenAmount = `${tokenPrefix}${formattedTokenNum}`;
  }

  return {
    tokenAmount,
    formattedTokenNum,
    value,
    pending: pending || isNFTPending,
  };
};
