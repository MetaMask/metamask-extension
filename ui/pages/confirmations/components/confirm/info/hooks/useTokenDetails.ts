import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getAllTokens } from '../../../../../../selectors';

export const useTokenDetails = (transactionMeta: TransactionMeta) => {
  const t = useI18nContext();
  const {
    chainId,
    txParams: { to, from },
  } = transactionMeta ?? { txParams: {} };

  const allTokens = useSelector(getAllTokens);
  const tokenListToken = allTokens?.[chainId]?.[from as string]?.find(
    (token) => token.address?.toLowerCase() === (to?.toLowerCase() as string),
  );

  const tokenImage = tokenListToken?.image || undefined;
  const tokenSymbol = tokenListToken?.symbol || t('unknown');

  return { tokenImage, tokenSymbol };
};
