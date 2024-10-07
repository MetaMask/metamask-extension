import { useSelector } from 'react-redux';
import { useContext, useEffect } from 'react';
import { Hex } from '@metamask/utils';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
} from '../../../../shared/constants/metametrics';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getCurrentChainId } from '../../../selectors';
import { parseTokenDetailDecimals, TokenDetailsERC20 } from '../utils/token';

/**
 * Track event that number of decimals in ERC20 is not obtained
 *
 * @param tokenAddress
 * @param tokenDetails
 * @param metricLocation
 * @returns
 */
const useTrackERC20WithoutDecimalInformation = (
  tokenAddress: Hex | string | undefined,
  tokenDetails?: TokenDetailsERC20,
  metricLocation = MetaMetricsEventLocation.SignatureConfirmation,
) => {
  const trackEvent = useContext(MetaMetricsContext);
  const chainId = useSelector(getCurrentChainId);

  useEffect(() => {
    if (!chainId || !tokenDetails) {
      return;
    }
    const { decimals, standard } = tokenDetails || {};
    if (standard === TokenStandard.ERC20) {
      let parsedDecimals = parseTokenDetailDecimals(decimals);
      if (parsedDecimals === undefined) {
        trackEvent({
          event: MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
          category: MetaMetricsEventCategory.Confirmations,
          properties: {
            token_decimals_available: false,
            asset_address: tokenAddress,
            asset_type: TokenStandard.ERC20,
            chain_id: chainId,
            location: metricLocation,
            ui_customizations: [
              MetaMetricsEventUiCustomization.RedesignedConfirmation,
            ],
          },
        });
      }
    }
  }, [tokenDetails, chainId, tokenAddress, trackEvent]);
};

export default useTrackERC20WithoutDecimalInformation;
