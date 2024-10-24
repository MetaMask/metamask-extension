import { TokenListMap } from '@metamask/assets-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getTokenList } from '../../../../../../selectors';
import { SelectedToken } from '../shared/selected-token';

export const useTokenDetails = (
  transactionMeta: TransactionMeta,
  selectedToken: SelectedToken,
) => {
  const t = useI18nContext();

  const tokenList = useSelector(getTokenList) as TokenListMap;

  const tokenImage =
    selectedToken?.iconUrl ||
    selectedToken?.image ||
    tokenList[transactionMeta?.txParams?.to as string]?.iconUrl;

  const tokenSymbol =
    selectedToken?.symbol ||
    tokenList[transactionMeta?.txParams?.to as string]?.symbol ||
    t('unknown');

  return { tokenImage, tokenSymbol };
};
