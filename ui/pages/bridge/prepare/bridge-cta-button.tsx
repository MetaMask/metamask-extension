import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '../../../components/component-library';
import {
  getFromAmount,
  getFromChain,
  getFromToken,
  getToChain,
  getToToken,
  getBridgeQuotes,
  getBridgeQuotesConfig,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';

export const BridgeCTAButton = () => {
  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote, isQuoteGoingToRefresh, quotesRefreshCount } =
    useSelector(getBridgeQuotes);
  const { maxRefreshCount, refreshRate } = useSelector(getBridgeQuotesConfig);

  const { submitBridgeTransaction } = useSubmitBridgeTransaction();

  const isTxSubmittable =
    fromToken && toToken && fromChain && toChain && fromAmount && activeQuote;

  const [isQuoteExpired, setIsQuoteExpired] = useState(false);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    // Reset the isQuoteExpired if quote fethching restarts
    if (quotesRefreshCount === 0) {
      setIsQuoteExpired(false);
      return () => clearTimeout(timeout);
    }
    // After the last quote refresh, set a timeout to expire the quote and disable the CTA
    if (quotesRefreshCount >= maxRefreshCount && !isQuoteGoingToRefresh) {
      timeout = setTimeout(() => {
        setIsQuoteExpired(true);
      }, refreshRate);
    }
    return () => clearTimeout(timeout);
  }, [isQuoteGoingToRefresh, quotesRefreshCount]);

  const label = useMemo(() => {
    if (isQuoteExpired) {
      return t('bridgeQuoteExpired');
    }

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
  }, [isLoading, fromAmount, toToken, isTxSubmittable, isQuoteExpired]);

  return (
    <Button
      data-testid="bridge-cta-button"
      onClick={() => {
        if (isTxSubmittable) {
          submitBridgeTransaction(activeQuote);
        }
      }}
      disabled={!isTxSubmittable || isQuoteExpired}
    >
      {label}
    </Button>
  );
};
