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
import { getCurrentCurrency, getUSDConversionRate } from '../../../selectors';
import { tokenAmountToCurrency } from '../../../ducks/bridge/utils';

const USD_CURRENCY_CODE = 'usd';

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
  const nativeToUsdRate = useSelector(getUSDConversionRate);

  // Use values from activeQuote if available, otherwise use validated input field values
  const fromTokenAddress = (
    activeQuote ? activeQuote.quote.srcAsset.address : srcTokenAddress
  )?.toLowerCase();
  const toTokenAddress = (
    activeQuote ? activeQuote.quote.destAsset.address : destTokenAddress
  )?.toLowerCase();

  const fromAmountInCurrency =
    activeQuote?.sentAmount?.valueInCurrency ?? fromAmountInputValueInCurrency;
  const fromAmount = fromAmountInputValue ?? activeQuote?.sentAmount.amount;

  const isCurrencyUsd = currency.toLowerCase() === USD_CURRENCY_CODE;

  return {
    // If a quote is passed in, derive the usd amount source from the quote
    // otherwise use input field values
    usd_amount_source: isCurrencyUsd
      ? fromAmountInCurrency.toNumber()
      : (fromTokenConversionRate?.usd &&
          fromAmount &&
          fromTokenAddress &&
          tokenAmountToCurrency(fromAmount, fromTokenConversionRate.usd)) ||
        0,
    // If user's selected currency is not usd, use usd exchange rates for
    // the gas token and convert the quoted gas amount to usd
    usd_quoted_gas:
      (isCurrencyUsd
        ? activeQuote?.gasFee.valueInCurrency?.toNumber()
        : activeQuote?.gasFee.amount &&
          tokenAmountToCurrency(activeQuote.gasFee.amount, nativeToUsdRate)) ||
      0,
    // If user's selected currency is not usd, use usd exchange rates for
    // the dest asset and convert the dest amount to usd
    usd_quoted_return:
      (isCurrencyUsd
        ? activeQuote?.toTokenAmount?.valueInCurrency?.toNumber()
        : activeQuote?.toTokenAmount?.amount &&
          toTokenAddress &&
          toTokenConversionRate.usd &&
          tokenAmountToCurrency(
            activeQuote.toTokenAmount.amount,
            toTokenConversionRate.usd,
          )) || 0,
  };
};
