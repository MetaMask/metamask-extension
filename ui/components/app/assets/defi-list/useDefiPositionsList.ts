import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  getEnabledNetworksByNamespace,
  getSelectedAccount,
  getTokenSortConfig,
} from '../../../../selectors';
import { getDefiPositions } from '../../../../selectors/assets';
import { useFormatters } from '../../../../hooks/useFormatters';
import { filterAssets } from '../util/filter';
import { sortAssets } from '../util/sort';
import { extractUniqueIconAndSymbols } from '../util/extractIconAndSymbol';
import { DeFiProtocolPosition } from '../types';

/**
 * The DeFi positions to render for the selected account, filtered to the
 * enabled networks and sorted with the user's token sort preference.
 *
 * `undefined` means the positions are still loading, `null` means they could
 * not be loaded, and an empty array means there is nothing to show.
 */
export type DefiPositionsList = DeFiProtocolPosition[] | null | undefined;

/**
 * Reads the DeFi positions of the selected account from state.
 *
 * @returns The positions to render, see {@link DefiPositionsList}.
 */
export function useDefiPositionsList(): DefiPositionsList {
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedAccount = useSelector(getSelectedAccount);

  const allDefiPositions = useSelector(getDefiPositions);

  return useMemo(() => {
    // error
    if (!selectedAccount) {
      return null;
    }

    // error
    if (!allDefiPositions) {
      return null;
    }

    const currentAddressDefiPositions =
      allDefiPositions?.[selectedAccount.address];

    // loading spinner
    if (currentAddressDefiPositions === undefined) {
      return undefined;
    }

    // error
    if (currentAddressDefiPositions === null) {
      return null;
    }

    const defiProtocolCells: DeFiProtocolPosition[] = Object.entries(
      currentAddressDefiPositions,
    ).flatMap(([chainId, chainData]) =>
      Object.entries(chainData.protocols).map(([protocolId, protocol]) => {
        const { name: protocolName, iconUrl } = protocol.protocolDetails;
        // TODO: Get market value in user's preferred currency
        const marketValue = protocol.aggregatedMarketValue;
        const iconGroup = extractUniqueIconAndSymbols(protocol);

        return {
          protocolId,
          title: protocolName,
          tokenImage: iconUrl,
          underlyingSymbols: iconGroup.map(({ symbol }) => symbol),
          marketValue: formatCurrencyWithMinThreshold(marketValue, 'USD'),
          chainId: chainId as Hex,
          iconGroup,
          tokenFiatAmount: marketValue,
        };
      }),
    );

    const filteredAssets = filterAssets(defiProtocolCells, [
      {
        key: 'chainId',
        opts: enabledNetworksByNamespace,
        filterCallback: 'inclusive',
      },
    ]);

    // sort filtered tokens based on the tokenSortConfig in state
    return sortAssets(filteredAssets, tokenSortConfig);
  }, [
    allDefiPositions,
    formatCurrencyWithMinThreshold,
    selectedAccount,
    tokenSortConfig,
    enabledNetworksByNamespace,
  ]);
}
