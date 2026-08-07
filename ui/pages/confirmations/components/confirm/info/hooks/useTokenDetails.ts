import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getAllTokens } from '../../../../../../selectors';

export const useTokenDetails = (transactionMeta: TransactionMeta) => {
  const t = useI18nContext();
  const { chainId, txParams, txParamsOriginal } = transactionMeta;
  const tokenAddress = txParamsOriginal?.to ?? txParams.to;
  const userAddress = txParamsOriginal?.from ?? txParams.from;

  const allTokens = useSelector(getAllTokens);
  const tokenListToken = allTokens?.[chainId]?.[userAddress as string]?.find(
    (token) =>
      token.address?.toLowerCase() === (tokenAddress?.toLowerCase() as string),
  );

  const tokenImage = tokenListToken?.image || undefined;
  const tokenSymbol = tokenListToken?.symbol || t('unknown');

  return { tokenImage, tokenSymbol };
};
