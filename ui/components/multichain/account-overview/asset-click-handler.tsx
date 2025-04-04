import { useCallback, useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ASSET_ROUTE } from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TokenWithFiatAmount } from '../../app/assets/types';

export function useAssetClickHandler() {
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);

  return useCallback(
    ({ chainId, address, symbol }: TokenWithFiatAmount) => {
      if (!chainId) {
        return;
      }

      // Navigate
      history.push(`${ASSET_ROUTE}/${chainId}/${address}`);

      // Track event: screen opened
      trackEvent({
        event: MetaMetricsEventName.TokenScreenOpened,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          token_symbol: symbol ?? 'unknown',
          location: 'Home',
        },
      });

      // Track event: token details
      trackEvent({
        category: MetaMetricsEventCategory.Tokens,
        event: MetaMetricsEventName.TokenDetailsOpened,
        properties: {
          location: 'Home',
          chain_id: chainId,
          token_symbol: symbol ?? 'unknown',
        },
      });
    },
    [history, trackEvent, showScamWarningModal],
  );
}
