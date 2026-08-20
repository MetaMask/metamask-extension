import { useEffect, useRef } from 'react';
import { Hex } from '@metamask/utils';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { parseTokenDetailDecimals, TokenDetailsERC20 } from '../utils/token';

/**
 * Track event that number of decimals in ERC20 is not obtained
 *
 * @param chainId
 * @param tokenAddress
 * @param tokenDetails
 * @param metricLocation
 */
const useTrackERC20WithoutDecimalInformation = (
  chainId: Hex,
  tokenAddress: Hex | string | undefined,
  tokenDetails?: TokenDetailsERC20,
  metricLocation = MetaMetricsEventLocation.SignatureConfirmation,
) => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (
      chainId === undefined ||
      tokenDetails === undefined ||
      hasTracked.current
    ) {
      return;
    }

    const { decimals, standard } = tokenDetails || {};
    if (standard !== TokenStandard.ERC20) {
      return;
    }

    const parsedDecimals = parseTokenDetailDecimals(decimals);
    if (parsedDecimals === undefined) {
      trackEvent(
        createEventBuilder(
          MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
        )
          .addCategory(MetaMetricsEventCategory.Confirmations)
          .addProperties({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_decimals_available: 'not_available',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            asset_address: tokenAddress,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            asset_type: TokenStandard.ERC20,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: chainId,
            location: metricLocation,
          })
          .build(),
      );
      hasTracked.current = true;
    }
  }, [
    chainId,
    createEventBuilder,
    metricLocation,
    tokenAddress,
    tokenDetails,
    trackEvent,
  ]);
};

export default useTrackERC20WithoutDecimalInformation;
