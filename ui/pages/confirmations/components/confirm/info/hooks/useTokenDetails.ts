import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { selectERC20TokensByChain } from '../../../../../../selectors';

export const useTokenDetails = (transactionMeta: TransactionMeta) => {
  const t = useI18nContext();
  const {
    chainId,
    txParams: { to },
  } = transactionMeta ?? { txParams: {} };
  const tokenListByChain = useSelector(selectERC20TokensByChain);
  const { iconUrl: tokenImage, symbol: tokenSymbol } = tokenListByChain[chainId]
    ?.data?.[to?.toLowerCase() as string] ?? {
    iconUrl: undefined,
    symbol: t('unknown'),
  };

  return { tokenImage, tokenSymbol };
};
