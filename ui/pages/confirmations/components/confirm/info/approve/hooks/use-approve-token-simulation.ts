import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { useIsNFT } from './use-is-nft';

export const UNLIMITED_MSG = 'UNLIMITED MESSAGE';

function isSpendingCapUnlimited(
  tokenDecimals: string,
  decodedSpendingCap: number,
) {
  const totalCirculatingSupplyBigNumber = new BigNumber(10).pow(
    Number(tokenDecimals),
  );

  // convert `decodedSpendingCap` to Big Number because numbers lose precision above
  // `Number.MAX_SAFE_INTEGER`
  const spendingCapBigNumber = new BigNumber(decodedSpendingCap);

  return spendingCapBigNumber.greaterThanOrEqualTo(
    totalCirculatingSupplyBigNumber,
  );
}

export const useApproveTokenSimulation = (transactionMeta: TransactionMeta) => {
  const locale = useSelector(getIntlLocale);

  const { isNFT, pending: isNFTPending, decimals } = useIsNFT(transactionMeta);

  const decodedResponse = useDecodedTransactionData();

  const { value, pending } = decodedResponse;

  const decodedSpendingCap = value ? value.data[0].params[1].value : 0;

  const tokenPrefix = isNFT ? '#' : '';
  const formattedTokenNum = isNFT
    ? decodedSpendingCap
    : new Intl.NumberFormat(locale).format(decodedSpendingCap);

  let tokenAmount;
  if (
    !isNFT &&
    decimals !== undefined &&
    isSpendingCapUnlimited(decimals, decodedSpendingCap)
  ) {
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
