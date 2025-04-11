/* eslint-disable camelcase */
import { useSelector } from 'react-redux';

import { SECOND } from '../../../../shared/constants/time';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { formatProviderLabel } from '../../../pages/bridge/utils/quote';
import { useIsTxSubmittable } from '../useIsTxSubmittable';

export const useQuoteProperties = () => {
  const { recommendedQuote, sortedQuotes, quotesInitialLoadTimeMs } =
    useSelector(getBridgeQuotes);

  const can_submit = useIsTxSubmittable();

  const initial_load_time_all_quotes = quotesInitialLoadTimeMs
    ? quotesInitialLoadTimeMs / SECOND
    : 0;

  return {
    can_submit,
    best_quote_provider: formatProviderLabel(recommendedQuote?.quote),
    quotes_count: sortedQuotes.length,
    quotes_list: sortedQuotes.map((quote) => formatProviderLabel(quote.quote)),
    initial_load_time_all_quotes,
  };
};
