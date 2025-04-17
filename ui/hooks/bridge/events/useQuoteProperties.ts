/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { formatProviderLabel } from '../../../pages/bridge/utils/quote';
import { useIsTxSubmittable } from '../useIsTxSubmittable';
import { SECOND } from '../../../../shared/constants/time';

export const useQuoteProperties = () => {
  const { recommendedQuote, sortedQuotes, quotesInitialLoadTimeMs } =
    useSelector(getBridgeQuotes);

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const can_submit = useIsTxSubmittable();

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const initial_load_time_all_quotes = quotesInitialLoadTimeMs
    ? quotesInitialLoadTimeMs / SECOND
    : 0;

  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    can_submit,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    best_quote_provider: formatProviderLabel(recommendedQuote?.quote),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    quotes_count: sortedQuotes.length,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    quotes_list: sortedQuotes.map((quote) => formatProviderLabel(quote.quote)),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    initial_load_time_all_quotes,
  };
};
