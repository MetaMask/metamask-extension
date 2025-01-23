/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { formatProviderLabel } from '../../../pages/bridge/utils/quote';
import { useConvertedUsdAmounts } from './useConvertedUsdAmounts';

export const useTradeProperties = () => {
  const { activeQuote } = useSelector(getBridgeQuotes);
  const { usd_amount_source, usd_quoted_gas, usd_quoted_return } =
    useConvertedUsdAmounts();

  const quoted_time_minutes = activeQuote?.estimatedProcessingTimeInSeconds
    ? activeQuote.estimatedProcessingTimeInSeconds / 60
    : 0;

  return {
    gas_included: false, // TODO check if trade has gas included
    quoted_time_minutes,
    provider: formatProviderLabel(activeQuote),
    usd_amount_source,
    usd_quoted_gas,
    usd_quoted_return,
  };
};
