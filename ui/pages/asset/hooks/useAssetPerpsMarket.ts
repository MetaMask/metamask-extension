import { useSelector } from 'react-redux';
import type { MarketInfo } from '@metamask/perps-controller';
import { getIsPerpsExperienceAvailable } from '../../../selectors/perps';
import { usePerpsMarketInfo } from '../../../hooks/perps/usePerpsMarketInfo';

/**
 * Finds the Perps market matching a wallet asset's symbol, mirroring mobile's
 * `usePerpsMarketForAsset`: an exact (case-insensitive) symbol match against
 * the provider's market list, so e.g. ETH on any chain maps to the ETH perp.
 *
 * Returns undefined when the Perps experience is unavailable (build or remote
 * flag), while the market list is loading, or when no market matches — in all
 * of these cases the asset page renders its regular action buttons.
 *
 * @param symbol - The wallet asset's symbol (e.g. 'ETH', 'DAI')
 * @returns The matching Perps market, or undefined
 */
export function useAssetPerpsMarket(symbol: string): MarketInfo | undefined {
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);
  return usePerpsMarketInfo(symbol, { enabled: isPerpsAvailable });
}
