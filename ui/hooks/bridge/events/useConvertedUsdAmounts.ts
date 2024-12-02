/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromAmountInFiat,
  getFromTokenConversionRate,
  getQuoteRequest,
  getToTokenConversionRate,
  getFromAmount,
} from '../../../ducks/bridge/selectors';
import { getCurrentCurrency, getUSDConversionRate } from '../../../selectors';
import { tokenAmountToFiat } from '../../../ducks/bridge/utils';

const USD_CURRENCY_CODE = 'usd';

// This hook is used to get the converted USD amounts for the bridge trade
// It returns fiat values if the user's selected currency is USD
// Otherwise, it converts the fiat values to USD using the exchange rates
// If the amount's usd value is not available, it defaults to 0
export const useConvertedUsdAmounts = () => {
  const { srcTokenAddress, destTokenAddress } = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const fromAmountInputValueInFiat = useSelector(getFromAmountInFiat);
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

  const fromAmountInFiat =
    activeQuote?.sentAmount?.fiat ?? fromAmountInputValueInFiat;
  const fromAmount = fromAmountInputValue ?? activeQuote?.sentAmount.amount;

  const isCurrencyUsd = currency.toLowerCase() === USD_CURRENCY_CODE;

  return {
    // If a quote is passed in, derive the usd amount source from the quote
    // otherwise use input field values
    usd_amount_source: isCurrencyUsd
      ? fromAmountInFiat.toNumber()
      : (fromTokenConversionRate?.usd &&
          fromAmount &&
          fromTokenAddress &&
          tokenAmountToFiat(fromAmount, fromTokenConversionRate.usd)) ||
        0,
    // If user's selected currency is not usd, use usd exchange rates for
    // the gas token and convert the quoted gas amount to usd
    usd_quoted_gas:
      (isCurrencyUsd
        ? activeQuote?.gasFee.fiat?.toNumber()
        : activeQuote?.gasFee.amount &&
          tokenAmountToFiat(activeQuote.gasFee.amount, nativeToUsdRate)) || 0,
    // If user's selected currency is not usd, use usd exchange rates for
    // the dest asset and convert the dest amount to usd
    usd_quoted_return:
      (isCurrencyUsd
        ? activeQuote?.toTokenAmount?.fiat?.toNumber()
        : activeQuote?.toTokenAmount?.amount &&
          toTokenAddress &&
          toTokenConversionRate.usd &&
          tokenAmountToFiat(
            activeQuote.toTokenAmount.amount,
            toTokenConversionRate.usd,
          )) || 0,
  };
};
