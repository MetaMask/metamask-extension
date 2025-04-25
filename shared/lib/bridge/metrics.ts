import {
  type QuoteMetadata,
  type QuoteResponse,
} from '@metamask/bridge-controller';

export const getConvertedUsdAmounts = ({
  activeQuote,
  fromAmountInputValueInUsd,
}: {
  activeQuote: (QuoteResponse & QuoteMetadata) | undefined;
  fromAmountInputValueInUsd: string;
}) => {
  // If a quote is passed in, derive the usd amount source from the quote
  // otherwise use input field values
  // Use values from activeQuote if available, otherwise use validated input field values
  const fromAmountInUsd =
    activeQuote?.sentAmount?.usd ?? fromAmountInputValueInUsd;

  return {
    usd_amount_source: Number(fromAmountInUsd),
    usd_quoted_gas: Number(activeQuote?.gasFee.usd ?? 0),
    usd_quoted_return: Number(activeQuote?.toTokenAmount?.usd ?? 0),
  };
};
