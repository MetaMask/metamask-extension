/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromAmountInCurrency,
} from '../../../ducks/bridge/selectors';
import { getConvertedUsdAmounts } from '../../../../shared/lib/bridge/metrics';

// This hook is used to get the converted USD amounts for the bridge trade
// It returns the converted token value if the user's selected currency is USD
// Otherwise, it converts the token amounts to USD using the exchange rates
// If the amount's usd value is not available, it defaults to 0
export const useConvertedUsdAmounts = () => {
  const { activeQuote } = useSelector(getBridgeQuotes);
  const { usd: fromAmountInputValueInUsd } = useSelector(
    getFromAmountInCurrency,
  );

  return getConvertedUsdAmounts({
    activeQuote: activeQuote ?? undefined,
    fromAmountInputValueInUsd: fromAmountInputValueInUsd.toString(),
  });
};
