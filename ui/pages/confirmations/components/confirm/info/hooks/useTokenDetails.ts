import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  getAllTokens,
  selectERC20TokensByChain,
} from '../../../../../../selectors';

export const useTokenDetails = (transactionMeta: TransactionMeta) => {
  const t = useI18nContext();
  const {
    chainId,
    txParams: { to, from },
  } = transactionMeta ?? { txParams: {} };
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);
  const allTokens = useSelector(getAllTokens);

  const erc20Token =
    erc20TokensByChain[chainId]?.data?.[to?.toLowerCase() as string];
  const tokenListToken = allTokens?.[chainId]?.[from as string]?.find(
    (token) => token.address?.toLowerCase() === (to?.toLowerCase() as string),
  );

  const tokenImage = erc20Token?.iconUrl || tokenListToken?.image || undefined;
  const tokenSymbol =
    erc20Token?.symbol || tokenListToken?.symbol || t('unknown');

  return { tokenImage, tokenSymbol };
};
