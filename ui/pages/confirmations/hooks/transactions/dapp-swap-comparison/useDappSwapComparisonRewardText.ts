import { TransactionMeta } from '@metamask/transaction-controller';
import { useRewardsWithQuote } from '../../../../../hooks/bridge/useRewards';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useDappSwapContext } from '../../../context/dapp-swap';

export const useDappSwapComparisonRewardText = (): {
  text: string;
  estimatedPoints: number;
} | null => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { selectedQuote } = useDappSwapContext();
  const t = useI18nContext();

  const { shouldShowRewardsRow, isLoading, estimatedPoints, hasError } =
    useRewardsWithQuote({
      quote: selectedQuote?.quote ?? null,
      fromAddress: transactionMeta?.txParams?.from ?? '',
      chainId: transactionMeta?.chainId ?? '',
    });

  if (!shouldShowRewardsRow || hasError || isLoading) {
    return null;
  }

  if (estimatedPoints) {
    return {
      text: t('dappSwapRewardText', [estimatedPoints.toString()]),
      estimatedPoints,
    };
  }

  return null;
};
