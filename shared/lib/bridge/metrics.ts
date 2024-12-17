import { BigNumber } from 'bignumber.js';
import { QuoteMetadata, QuoteResponse } from '../../../ui/pages/bridge/types';
import { tokenAmountToCurrency } from '../../../ui/ducks/bridge/utils';

const USD_CURRENCY_CODE = 'usd';

type ConversionRate = {
  valueInCurrency: number | null;
  usd: number | null;
};

export const getConvertedUsdAmounts = ({
  activeQuote,
  srcTokenAddress,
  destTokenAddress,
  fromAmountInputValueInCurrency,
  fromAmountInputValue,
  currency,
  nativeToUsdRate,
  fromTokenConversionRate,
  toTokenConversionRate,
}: {
  activeQuote: (QuoteResponse & QuoteMetadata) | undefined;
  srcTokenAddress: string | undefined;
  destTokenAddress: string | undefined;
  fromAmountInputValueInCurrency: BigNumber;
  fromAmountInputValue: string | null;
  currency: string;
  nativeToUsdRate: number;
  fromTokenConversionRate: ConversionRate;
  toTokenConversionRate: ConversionRate;
}) => {
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
