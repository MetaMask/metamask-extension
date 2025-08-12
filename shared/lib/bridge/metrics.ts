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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_amount_source: Number(fromAmountInUsd),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_quoted_gas: Number(activeQuote?.gasFee.effective.usd ?? 0),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_quoted_return: Number(activeQuote?.toTokenAmount?.usd ?? 0),
  };
};
