import { useSelector } from 'react-redux';
import { useCallback, useContext } from 'react';
import { Hex } from '@metamask/utils';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
} from '../../../../shared/constants/metametrics';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useAsyncResult } from '../../../hooks/useAsyncResult';
import { getCurrentChainId } from '../../../selectors';
import {
  ERC20_DEFAULT_DECIMALS,
  parseTokenDetailDecimals,
  memoizedGetTokenStandardAndDetails,
  TokenDetailsERC20,
} from '../utils/token';

type UseGetTokenStandardAndDetailsProps = {
  canTrackMissingDecimalsMetric: boolean;

  // We can add these optional params to support ERC721 and ERC1155
  // tokenId?: string;
  // userAddress?: string;
};

/**
 * Returns token details for a given token contract
 *
 * @param tokenAddress
 * @param options
 * @param options.canTrackMissingDecimalsMetric
 * @returns
 */
const useGetTokenStandardAndDetails = (
  tokenAddress: Hex | string | undefined,
  {
    canTrackMissingDecimalsMetric = false,
  }: Partial<UseGetTokenStandardAndDetailsProps> = {},
) => {
  const trackEvent = useContext(MetaMetricsContext);
  const chainId = useSelector(getCurrentChainId);

  const { value: details } = useAsyncResult<TokenDetailsERC20>(
    async () =>
      (await memoizedGetTokenStandardAndDetails(
        tokenAddress,
      )) as TokenDetailsERC20,
    [tokenAddress],
  );

  const { decimals, standard } = details || {};

  const trackIncompleteAsset = useCallback(() => {
    trackEvent({
      event: MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
      category: MetaMetricsEventCategory.Confirmations,
      properties: {
        token_decimals_available: false,
        asset_address: tokenAddress,
        asset_type: TokenStandard.ERC20,
        chain_id: chainId,
        location: MetaMetricsEventLocation.Confirmation,
        ui_customizations: [
          MetaMetricsEventUiCustomization.RedesignedConfirmation,
        ],
      },
    });
  }, [chainId, tokenAddress, trackEvent]);

  if (!details) {
    return { decimalsNumber: undefined };
  }

  if (standard === TokenStandard.ERC20) {
    let parsedDecimals = parseTokenDetailDecimals(decimals);
    if (parsedDecimals === undefined) {
      parsedDecimals = ERC20_DEFAULT_DECIMALS;
    }

    details.decimals = String(parsedDecimals);
    details.decimalsNumber = parsedDecimals;

    if (canTrackMissingDecimalsMetric) {
      trackIncompleteAsset();
    }
  }

  return details;
};

export default useGetTokenStandardAndDetails;
