import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useDecodedTransactionData } from '../../hooks/useDecodedTransactionData';
import { useIsNFT } from './use-is-nft';

const UNLIMITED_THRESHOLD = 10 ** 15;

export const useApproveTokenSimulation = (transactionMeta: TransactionMeta) => {
  const t = useI18nContext();

  const locale = useSelector(getIntlLocale);

  const { isNFT } = useIsNFT(transactionMeta);

  const decodedResponse = useDecodedTransactionData();

  const { value, pending } = decodedResponse;

  const tokenNum = value ? value.data[0].params[1].value : 0;

  const tokenPrefix = isNFT ? '#' : '';
  const formattedTokenNum = isNFT
    ? tokenNum
    : new Intl.NumberFormat(locale).format(tokenNum);

  let tokenAmount;
  if (!isNFT && tokenNum > UNLIMITED_THRESHOLD) {
    tokenAmount = t('unlimited');
  } else {
    tokenAmount = `${tokenPrefix}${formattedTokenNum}`;
  }

  return { tokenAmount, formattedTokenNum, value, pending };
};
