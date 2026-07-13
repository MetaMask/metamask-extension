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
import { useMultiAccountDefiBalances } from './hooks/useMultiAccountDefiBalances';
import { DeFiErrorMessage } from './cells/defi-error-message';
import { DeFiEmptyStateMessage } from './cells/defi-empty-state';
import DeFiProtocolCellV2 from './cells/defi-protocol-cell-v2';
import {
  filterGroupedDefiProtocolPositions,
  groupDefiProtocolPositions,
  isDefiBalancesProcessing,
} from './utils/group-defi-protocol-positions';
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
  const { data, isLoading, isError } = useMultiAccountDefiBalances();

  const groupedPositions = useMemo(
    () => groupDefiProtocolPositions(data),
    [data],
  );

  const sortedFilteredDefi = useMemo(():
    | DeFiProtocolListItem[]
    | null
    | undefined => {
    if (isLoading || isDefiBalancesProcessing(data)) {
      return undefined;
    }

    if (isError) {
      return null;
    }

    const filteredPositions = filterGroupedDefiProtocolPositions(
      groupedPositions,
      enabledCaipChainIds,
    );

    const listItems: DeFiProtocolListItem[] = filteredPositions.map(
      (position) => ({
        ...position,
        marketValue: formatCurrencyWithMinThreshold(
          position.tokenFiatAmount,
          selectedCurrency,
        ),
      }),
    );

    return sortAssets(listItems, tokenSortConfig);
  }, [
    data,
    groupedPositions,
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
