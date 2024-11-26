import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '../../../components/component-library';
import {
  getFromAmount,
  getFromChain,
  getFromToken,
  getToChain,
  getToToken,
  getBridgeQuotes,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';

export const BridgeCTAButton = () => {
  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);

  const { submitBridgeTransaction } = useSubmitBridgeTransaction();

  const { isNoQuotesAvailable, isInsufficientBalance } =
    useSelector(getValidationErrors);

  const { normalizedBalance } = useLatestBalance(fromToken, fromChain?.chainId);

  const isTxSubmittable =
    fromToken &&
    toToken &&
    fromChain &&
    toChain &&
    fromAmount &&
    activeQuote &&
    !isInsufficientBalance(normalizedBalance);

  const label = useMemo(() => {
    if (isLoading && !isTxSubmittable) {
      return t('swapFetchingQuotes');
    }

    if (isNoQuotesAvailable) {
      return t('swapQuotesNotAvailableErrorTitle');
    }

    if (isInsufficientBalance(normalizedBalance)) {
      return t('alertReasonInsufficientBalance');
    }

    if (!fromAmount) {
      if (!toToken) {
        return t('bridgeSelectTokenAndAmount');
      }
      return t('bridgeEnterAmount');
    }

    if (isTxSubmittable) {
      return t('confirm');
    }

    return t('swapSelectToken');
  }, [
    isLoading,
    fromAmount,
    toToken,
    isTxSubmittable,
    normalizedBalance,
    isInsufficientBalance,
  ]);

  return (
    <Button
      data-testid="bridge-cta-button"
      onClick={() => {
        if (isTxSubmittable) {
          submitBridgeTransaction(activeQuote);
        }
      }}
      disabled={!isTxSubmittable}
    >
      {label}
    </Button>
  );
};
