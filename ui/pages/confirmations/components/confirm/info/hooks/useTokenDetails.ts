import { TokenListMap } from '@metamask/assets-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getTokenList, getWatchedToken } from '../../../../../../selectors';
import { MultichainState } from '../../../../../../selectors/multichain';

export const useTokenDetails = (transactionMeta: TransactionMeta) => {
  const t = useI18nContext();
  const selectedToken = useSelector((state: MultichainState) =>
    getWatchedToken(transactionMeta)(state),
  );
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
