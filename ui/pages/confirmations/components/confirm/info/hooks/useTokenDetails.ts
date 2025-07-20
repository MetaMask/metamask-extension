import { TokenListMap } from '@metamask/assets-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getTokenList, getWatchedToken, getCurrentChainId } from '../../../../../../selectors';
import { MultichainState } from '../../../../../../selectors/multichain';

export const useTokenDetails = (transactionMeta: TransactionMeta) => {
  const t = useI18nContext();
  const selectedToken = useSelector((state: MultichainState) =>
    getWatchedToken(transactionMeta)(state),
  );
  const tokenList = useSelector(getTokenList) as TokenListMap;
  const currentChainId = useSelector(getCurrentChainId);

  // Filter tokenList by current chain ID
  const getTokenFromList = (address: string) => {
    if (!address) return null;
    const tokenData = tokenList[address];
    if (!tokenData) return null;
    
    // If token has chainId, ensure it matches current chain
    if (tokenData.chainId && tokenData.chainId !== currentChainId) {
      return null;
    }
    
    return tokenData;
  };

  const tokenImage =
    selectedToken?.iconUrl ||
    selectedToken?.image ||
    getTokenFromList(transactionMeta?.txParams?.to as string)?.iconUrl;

  const tokenSymbol =
    selectedToken?.symbol ||
    getTokenFromList(transactionMeta?.txParams?.to as string)?.symbol ||
    t('unknown');

  return { tokenImage, tokenSymbol };
};
