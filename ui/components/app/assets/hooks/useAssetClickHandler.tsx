import { useCallback, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { TokenWithFiatAmount } from '../types';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { getMultichainNetwork } from '../../../../selectors/multichain';
import { getSelectedInternalAccount } from '../../../../selectors';

export function useAssetClickHandler() {
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const account = useSelector(getSelectedInternalAccount);
  const { isEvmNetwork } = useMultichainSelector(getMultichainNetwork, account);

  return useCallback(
    ({ chainId, detailsPageRoute, symbol }: TokenWithFiatAmount) => {
      // Check if the asset is a valid EVM token
      if (!isEvmNetwork) {
        return;
      }

      // Ensure token has a valid chainId before proceeding
      if (!chainId) {
        return;
      }

      // Navigate
      history.push(detailsPageRoute);

      // Track event: screen opened
      trackEvent({
        event: MetaMetricsEventName.TokenScreenOpened,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          location: 'Home',
          token_symbol: symbol ?? 'unknown',
        },
      });

      // Track event: token details
      trackEvent({
        category: MetaMetricsEventCategory.Tokens,
        event: MetaMetricsEventName.TokenDetailsOpened,
        properties: {
          location: 'Home',
          token_symbol: symbol ?? 'unknown',
          chain_id: chainId,
        },
      });
    },
    [history, trackEvent],
  );
}
