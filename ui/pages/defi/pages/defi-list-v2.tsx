import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { getTokenSortConfig } from '../../../selectors';
import { getSelectedCurrency } from '../../../selectors/assets';
import { selectEnabledNetworksAsCaipChainIds } from '../../../selectors/multichain/networks';
import { sortAssets } from '../../../components/app/assets/util/sort';
import PulseLoader from '../../../components/ui/pulse-loader';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { VirtualizedList } from '../../../components/ui/virtualized-list/virtualized-list';
import { ASSET_CELL_HEIGHT } from '../../../components/app/assets/constants';
import { DeFiErrorMessage } from '../../../components/app/assets/defi-list/cells/defi-error-message';
import { DeFiEmptyStateMessage } from '../../../components/app/assets/defi-list/cells/defi-empty-state';
import DeFiProtocolCellV2, {
  type DeFiProtocolListItem,
} from '../components/defi-protocol-cell-v2';

type DefiListV2Props = {
  onClick: (chainId: string, protocolId: string) => void;
  positions: DeFiProtocolPositionGroup[];
  isLoading: boolean;
  isError: boolean;
};

export default function DefiListV2({
  onClick,
  positions,
  isLoading,
  isError,
}: Readonly<DefiListV2Props>) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedCurrency = useSelector(getSelectedCurrency);
  const enabledCaipChainIds = useSelector(selectEnabledNetworksAsCaipChainIds);

  const sortedFilteredDefi = useMemo(():
    | DeFiProtocolListItem[]
    | null
    | undefined => {
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

  if (sortedFilteredDefi === undefined) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        className="flex"
      >
        <PulseLoader />
      </Box>
    );
  }

  if (sortedFilteredDefi === null) {
    return (
      <DeFiErrorMessage
        title={t('defiTabErrorTitle')}
        text={t('defiTabErrorContent')}
      />
    );
  }

  return (
    <VirtualizedList
      data={sortedFilteredDefi}
      estimatedItemSize={ASSET_CELL_HEIGHT}
      overscan={10}
      keyExtractor={(position) => `${position.protocolId}#${position.chainId}`}
      renderItem={({ item: position }) => (
        <DeFiProtocolCellV2 position={position} onClick={onClick} />
      )}
      listEmptyComponent={<DeFiEmptyStateMessage />}
    />
  );
}
