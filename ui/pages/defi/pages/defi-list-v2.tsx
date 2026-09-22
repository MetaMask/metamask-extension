import React from 'react';
import type { DeFiProtocolPositionGroup } from '@metamask/assets-controllers';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import PulseLoader from '../../../components/ui/pulse-loader';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { VirtualizedList } from '../../../components/ui/virtualized-list/virtualized-list';
import { ASSET_CELL_HEIGHT } from '../../../components/app/assets/constants';
import { DeFiErrorMessage } from '../../../components/app/assets/defi-list/cells/defi-error-message';
import { DeFiEmptyStateMessage } from '../../../components/app/assets/defi-list/cells/defi-empty-state';
import DeFiProtocolCellV2 from '../components/defi-protocol-cell-v2';
import { useDeFiListItemsV2 } from '../hooks/useDeFiListItemsV2';

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
  const sortedFilteredDefi = useDeFiListItemsV2({
    positions,
    isLoading,
    isError,
  });

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
