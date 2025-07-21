/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { formatProviderLabel } from '../../../pages/bridge/utils/quote';
import { useConvertedUsdAmounts } from './useConvertedUsdAmounts';

export const useTradeProperties = () => {
  const { activeQuote } = useSelector(getBridgeQuotes);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { usd_amount_source, usd_quoted_gas, usd_quoted_return } =
    useConvertedUsdAmounts();

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const quoted_time_minutes = activeQuote?.estimatedProcessingTimeInSeconds
    ? activeQuote.estimatedProcessingTimeInSeconds / 60
    : 0;

  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gas_included: false, // TODO check if trade has gas included
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    quoted_time_minutes,
    provider: formatProviderLabel(activeQuote?.quote),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_amount_source,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_quoted_gas,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_quoted_return,
  };
};
