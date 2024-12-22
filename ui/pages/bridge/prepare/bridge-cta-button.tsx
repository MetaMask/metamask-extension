import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '../../../components/component-library';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromToken,
  getToAmount,
  getToChain,
  getToToken,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const BridgeCTAButton = () => {
  const t = useI18nContext();
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);
  const toAmount = useSelector(getToAmount);

  const { isLoading } = useSelector(getBridgeQuotes);

  const isTxSubmittable =
    fromToken && toToken && fromChain && toChain && fromAmount && toAmount;

  const label = useMemo(() => {
    if (isLoading && !isTxSubmittable) {
      return t('swapFetchingQuotes');
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
  }, [isLoading, fromAmount, toToken, isTxSubmittable]);

  return (
    <Button
      data-testid="bridge-cta-button"
      onClick={() => {
        if (isTxSubmittable) {
          // dispatch tx submission
        }
      }}
      disabled={!isTxSubmittable}
    >
      {label}
    </Button>
  );
};
