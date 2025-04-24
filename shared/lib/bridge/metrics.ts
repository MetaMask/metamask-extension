import { BigNumber } from 'bignumber.js';
import {
  type QuoteMetadata,
  type QuoteResponse,
} from '@metamask/bridge-controller';

export const getConvertedUsdAmounts = ({
  activeQuote,
  fromAmountInputValueInUsd,
}: {
  activeQuote: (QuoteResponse & QuoteMetadata) | undefined;
  fromAmountInputValueInUsd: BigNumber;
}) => {
  // If a quote is passed in, derive the usd amount source from the quote
  // otherwise use input field values
  // Use values from activeQuote if available, otherwise use validated input field values
  const fromAmountInUsd =
    activeQuote?.sentAmount?.usd ?? fromAmountInputValueInUsd;

  return {
    usd_amount_source: fromAmountInUsd.toNumber(),
    usd_quoted_gas: activeQuote?.gasFee.usd?.toNumber() ?? 0,
    usd_quoted_return: activeQuote?.toTokenAmount?.usd?.toNumber() ?? 0,
  };
};
