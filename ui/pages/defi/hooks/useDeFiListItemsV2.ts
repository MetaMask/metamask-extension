import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import { getTokenSortConfig } from '../../../selectors';
import { getSelectedCurrency } from '../../../selectors/assets';
import { selectEnabledNetworksAsCaipChainIds } from '../../../selectors/multichain/networks';
import { sortAssets } from '../../../components/app/assets/util/sort';
import { useFormatters } from '../../../hooks/useFormatters';
import { type DeFiProtocolListItem } from '../components/defi-protocol-cell-v2';

/**
 * The DeFi positions to render, filtered to the enabled networks and sorted
 * with the user's token sort preference.
 *
 * `undefined` means the positions are still loading, `null` means they could
 * not be loaded, and an empty array means there is nothing to show.
 */
export type DeFiListItemsV2 = DeFiProtocolListItem[] | null | undefined;

/**
 * Derives the rows of the V2 DeFi list from the positions returned by
 * `useDeFiPositionsV2`.
 *
 * @param args - The result of `useDeFiPositionsV2`.
 * @param args.positions - Protocol groups for the selected account group.
 * @param args.isLoading - Whether the positions are still being fetched.
 * @param args.isError - Whether the fetch failed.
 * @returns The rows to render, see {@link DeFiListItemsV2}.
 */
export function useDeFiListItemsV2({
  positions,
  isLoading,
  isError,
}: {
  positions: DeFiProtocolPositionGroup[];
  isLoading: boolean;
  isError: boolean;
}): DeFiListItemsV2 {
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedCurrency = useSelector(getSelectedCurrency);
  const enabledCaipChainIds = useSelector(selectEnabledNetworksAsCaipChainIds);

  return useMemo((): DeFiListItemsV2 => {
    if (isLoading) {
      return undefined;
    }

    // Only show the full error state when there is nothing cached to display.
    // A transient background-refresh failure must not hide already-fetched
    // positions (consistent with the details page, which keeps rendering
    // cached data on error).
    if (isError && positions.length === 0) {
      return null;
    }

    const enabledChainIds = new Set(enabledCaipChainIds);

    const listItems: DeFiProtocolListItem[] = positions
      .filter((position) => enabledChainIds.has(position.chainId))
      .map((position) => {
        const iconGroup = position.iconGroup.map((icon) => ({
          symbol: icon.symbol,
          avatarValue: icon.avatarValue ?? '',
        }));

        return {
          chainId: position.chainId,
          protocolId: position.protocolId,
          tokenImage: position.protocolIconUrl,
          iconGroup,
          underlyingSymbols: iconGroup.map(({ symbol }) => symbol),
          tokenFiatAmount: position.marketValue,
          marketValue: formatCurrencyWithMinThreshold(
            position.marketValue,
            selectedCurrency,
          ),
        };
      });

    return sortAssets(listItems, tokenSortConfig);
  }, [
    positions,
    enabledCaipChainIds,
    formatCurrencyWithMinThreshold,
    isError,
    isLoading,
    selectedCurrency,
    tokenSortConfig,
  ]);
}
