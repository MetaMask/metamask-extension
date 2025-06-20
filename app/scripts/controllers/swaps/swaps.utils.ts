import { BigNumber } from 'bignumber.js';
import { MAX_GAS_LIMIT } from './swaps.constants';
import type { Quote } from './swaps.types';

/**
 * Calculates the median overallValueOfQuote of a sample of quotes.
 *
 * @param _quotes - A sample of quote objects with overallValueOfQuote, ethFee, metaMaskFeeInEth, and ethValueOfTokens properties
 * @returns An object with the ethValueOfTokens, ethFee, and metaMaskFeeInEth of the quote with the median overallValueOfQuote
 */
export function getMedianEthValueQuote(_quotes: Quote[]) {
  if (!Array.isArray(_quotes) || _quotes.length === 0) {
    throw new Error('Expected non-empty array param.');
  }

  const quotes = [..._quotes];

  quotes.sort((quoteA, quoteB) => {
    const overallValueOfQuoteA = new BigNumber(quoteA.overallValueOfQuote, 10);
    const overallValueOfQuoteB = new BigNumber(quoteB.overallValueOfQuote, 10);
    if (overallValueOfQuoteA.equals(overallValueOfQuoteB)) {
      return 0;
    }
    return overallValueOfQuoteA.lessThan(overallValueOfQuoteB) ? -1 : 1;
  });

  if (quotes.length % 2 === 1) {
    // return middle values
    const medianOverallValue =
      quotes[(quotes.length - 1) / 2].overallValueOfQuote;
    const quotesMatchingMedianQuoteValue = quotes.filter(
      (quote) => medianOverallValue === quote.overallValueOfQuote,
    );
    return meansOfQuotesFeesAndValue(quotesMatchingMedianQuoteValue);
  }

  // return mean of middle two values
  const upperIndex = quotes.length / 2;
  const lowerIndex = upperIndex - 1;

  const overallValueAtUpperIndex = quotes[upperIndex].overallValueOfQuote;
  const overallValueAtLowerIndex = quotes[lowerIndex].overallValueOfQuote;

  const quotesMatchingUpperIndexValue = quotes.filter(
    (quote) => overallValueAtUpperIndex === quote.overallValueOfQuote,
  );
  const quotesMatchingLowerIndexValue = quotes.filter(
    (quote) => overallValueAtLowerIndex === quote.overallValueOfQuote,
  );

  const feesAndValueAtUpperIndex = meansOfQuotesFeesAndValue(
    quotesMatchingUpperIndexValue,
  );
  const feesAndValueAtLowerIndex = meansOfQuotesFeesAndValue(
    quotesMatchingLowerIndexValue,
  );

  return {
    ethFee: new BigNumber(feesAndValueAtUpperIndex.ethFee, 10)
      .plus(feesAndValueAtLowerIndex.ethFee, 10)
      .dividedBy(2)
      .toString(10),
    metaMaskFeeInEth: new BigNumber(
      feesAndValueAtUpperIndex.metaMaskFeeInEth,
      10,
    )
      .plus(feesAndValueAtLowerIndex.metaMaskFeeInEth, 10)
      .dividedBy(2)
      .toString(10),
    ethValueOfTokens: new BigNumber(
      feesAndValueAtUpperIndex.ethValueOfTokens,
      10,
    )
      .plus(feesAndValueAtLowerIndex.ethValueOfTokens, 10)
      .dividedBy(2)
      .toString(10),
  };
}

/**
 * Calculates the arithmetic mean for each of three properties - ethFee, metaMaskFeeInEth and ethValueOfTokens - across
 * an array of objects containing those properties.
 *
 * @param quotes - A sample of quote objects with overallValueOfQuote, ethFee, metaMaskFeeInEth and
 * ethValueOfTokens properties
 * @returns An object with the arithmetic mean each of the ethFee, metaMaskFeeInEth and ethValueOfTokens of
 * the passed quote objects
 */
export function meansOfQuotesFeesAndValue(quotes: Quote[]) {
  const feeAndValueSumsAsBigNumbers = quotes.reduce(
    (feeAndValueSums, quote) => ({
      ethFee: feeAndValueSums.ethFee.plus(quote.ethFee, 10),
      metaMaskFeeInEth: feeAndValueSums.metaMaskFeeInEth.plus(
        quote.metaMaskFeeInEth,
        10,
      ),
      ethValueOfTokens: feeAndValueSums.ethValueOfTokens.plus(
        quote.ethValueOfTokens,
        10,
      ),
    }),
    {
      ethFee: new BigNumber(0, 10),
      metaMaskFeeInEth: new BigNumber(0, 10),
      ethValueOfTokens: new BigNumber(0, 10),
    },
  );

  return {
    ethFee: feeAndValueSumsAsBigNumbers.ethFee
      .div(quotes.length, 10)
      .toString(10),
    metaMaskFeeInEth: feeAndValueSumsAsBigNumbers.metaMaskFeeInEth
      .div(quotes.length, 10)
      .toString(10),
    ethValueOfTokens: feeAndValueSumsAsBigNumbers.ethValueOfTokens
      .div(quotes.length, 10)
      .toString(10),
  };
}

/**
 * Calculates the gas estimate after subtracting a refund from the maximum gas limit.
 *
 * @param maxGas - The maximum gas limit, defaulting to MAX_GAS_LIMIT.
 * @param estimatedRefund - The estimated refund to subtract from the maximum gas limit, represented as a string.
 * @param estimatedGas - The estimated gas required for the transaction, represented as a string.
 * @returns The gas estimate with refund applied, represented as a hexadecimal string. If the subtraction
 * results in a negative value or is less than the estimated gas, returns the estimated gas.
 */
export function calculateGasEstimateWithRefund(
  maxGas = MAX_GAS_LIMIT,
  estimatedRefund = '0',
  estimatedGas = '0',
) {
  const maxGasMinusRefund = new BigNumber(maxGas, 10).minus(
    estimatedRefund,
    10,
  );
  const isMaxGasMinusRefundNegative = maxGasMinusRefund.lt(0);

  const gasEstimateWithRefund =
    !isMaxGasMinusRefundNegative && maxGasMinusRefund.lt(estimatedGas, 16)
      ? `0x${maxGasMinusRefund.toString(16)}`
      : estimatedGas;

  return gasEstimateWithRefund;
}
