import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { getTokenSortConfig } from '../../../../selectors';
import { getSelectedCurrency } from '../../../../selectors/assets';
import { selectEnabledNetworksAsCaipChainIds } from '../../../../selectors/multichain/networks';
import { sortAssets } from '../util/sort';
import PulseLoader from '../../../ui/pulse-loader';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { VirtualizedList } from '../../../ui/virtualized-list/virtualized-list';
import { ASSET_CELL_HEIGHT } from '../constants';
import { useDeFiPositionsV2 } from './hooks/useDeFiPositionsV2';
import { DeFiErrorMessage } from './cells/defi-error-message';
import { DeFiEmptyStateMessage } from './cells/defi-empty-state';
import DeFiProtocolCellV2 from './cells/defi-protocol-cell-v2';
import type { DeFiProtocolListItem } from './types';

type DefiListV2Props = {
  onClick: (chainId: string, protocolId: string) => void;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DefiListV2({ onClick }: DefiListV2Props) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const selectedCurrency = useSelector(getSelectedCurrency);
  const enabledCaipChainIds = useSelector(selectEnabledNetworksAsCaipChainIds);

  // Dispatches the fetch when the user enters the DeFi tab and reads the
  // resulting positions straight from the controller state.
  const { positions, isLoading, isError } = useDeFiPositionsV2();

  const sortedFilteredDefi = useMemo(():
    | DeFiProtocolListItem[]
    | null
    | undefined => {
    if (isLoading) {
      return undefined;
    }

    if (isError) {
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
