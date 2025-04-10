import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { calcSlippagePercentage } from '../utils/quote';

const useQuotePriceImpact = () => {
  const { activeQuote } = useSelector(getBridgeQuotes);

  const displayPriceImpactAlert = useMemo(() => {
    if (!activeQuote) {
      return false;
    }

    const slippagePercentage = calcSlippagePercentage(
      activeQuote.adjustedReturn,
      activeQuote.sentAmount,
    );

    console.log('the slippage is ', slippagePercentage);

    // If slippage is bigger than 5% in either currency, we need to show the alert
    const SLIPPAGE_THRESHOLD = 5;

    return (
      (slippagePercentage.percentageInCurrency &&
        slippagePercentage.percentageInCurrency > SLIPPAGE_THRESHOLD) ||
      (slippagePercentage.percentageInUsd &&
        slippagePercentage.percentageInUsd > SLIPPAGE_THRESHOLD) ||
      false
    );
  }, [activeQuote]);

  return {
    displayPriceImpactAlert,
    activeQuote,
  };
};

export default useQuotePriceImpact;
