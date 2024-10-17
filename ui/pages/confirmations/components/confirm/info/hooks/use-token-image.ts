import { TokenListMap } from '@metamask/assets-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { getTokenList } from '../../../../../../selectors';
import { SelectedToken } from '../shared/selected-token';

export const useTokenImage = (
  transactionMeta: TransactionMeta,
  selectedToken: SelectedToken,
) => {
  const tokenList = useSelector(getTokenList) as TokenListMap;

  // TODO: Add support for NFT images in one of the following tasks
  const tokenImage =
    selectedToken?.iconUrl ||
    selectedToken?.image ||
    tokenList[transactionMeta?.txParams?.to as string]?.iconUrl;

  return { tokenImage };
};
