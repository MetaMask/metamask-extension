import { TokenListMap } from '@metamask/assets-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getCurrentChainId, getTokenList, getWatchedToken } from '../../../../../../selectors';
import { MultichainState } from '../../../../../../selectors/multichain';
import { hexToDecimal } from '../../../../../../shared/modules/conversion.utils';

/**
 * Hook to get token details with chain ID filtering
 * @param transactionMeta - The transaction metadata
 * @returns Object containing token image and symbol
 */
export const useTokenDetails = (transactionMeta: TransactionMeta) => {
  const t = useI18nContext();
  const selectedToken = useSelector((state: MultichainState) =>
    getWatchedToken(transactionMeta)(state),
  );
  const chainId = useSelector((state: MultichainState) => getCurrentChainId(state));
  const tokenList = useSelector(getTokenList) as TokenListMap;

  // Filter tokens by the current chain ID
  const getTokenFromList = (address: string) => {
    if (!address) {
      return null;
    }
    
    const token = tokenList[address];
    if (!token) {
      return null;
    }

    // If token has a chainId, ensure it matches the current chain
    if (token.chainId && hexToDecimal(token.chainId) !== hexToDecimal(chainId)) {
      return null;
    }

    return token;
  };

  const tokenFromList = getTokenFromList(transactionMeta?.txParams?.to as string);
  
  const tokenImage = selectedToken?.iconUrl || selectedToken?.image || tokenFromList?.iconUrl;
  const tokenSymbol = selectedToken?.symbol || tokenFromList?.symbol || t('unknown');

  return { tokenImage, tokenSymbol };
};
