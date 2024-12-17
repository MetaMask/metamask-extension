/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromAmountInCurrency,
  getFromTokenConversionRate,
  getQuoteRequest,
  getToTokenConversionRate,
  getFromAmount,
} from '../../../ducks/bridge/selectors';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getUSDConversionRate } from '../../../selectors';
import { getConvertedUsdAmounts } from '../../../../shared/lib/bridge/metrics';

// This hook is used to get the converted USD amounts for the bridge trade
// It returns the converted token value if the user's selected currency is USD
// Otherwise, it converts the token amounts to USD using the exchange rates
// If the amount's usd value is not available, it defaults to 0
export const useConvertedUsdAmounts = () => {
  const { srcTokenAddress, destTokenAddress } = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const fromAmountInputValueInCurrency = useSelector(getFromAmountInCurrency);
  const fromAmountInputValue = useSelector(getFromAmount);
  const fromTokenConversionRate = useSelector(getFromTokenConversionRate);
  const toTokenConversionRate = useSelector(getToTokenConversionRate);
  const currency = useSelector(getCurrentCurrency);
  const nativeToUsdRate = useSelector(getUSDConversionRate) as number;

  return getConvertedUsdAmounts({
    activeQuote,
    srcTokenAddress,
    destTokenAddress,
    fromAmountInputValueInCurrency,
    fromAmountInputValue,
    currency,
    nativeToUsdRate,
    fromTokenConversionRate,
    toTokenConversionRate,
  });
};
