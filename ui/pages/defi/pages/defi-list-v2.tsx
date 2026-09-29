import React from 'react';
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
import { type DeFiListItemsV2 } from '../hooks/useDeFiListItemsV2';

type DefiListV2Props = {
  items: DeFiListItemsV2;
  onClick: (chainId: string, protocolId: string) => void;
};

export default function DefiListV2({
  items,
  onClick,
}: Readonly<DefiListV2Props>) {
  const t = useI18nContext();

  if (items === undefined) {
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

  if (items === null) {
    return (
      <DeFiErrorMessage
        title={t('defiTabErrorTitle')}
        text={t('defiTabErrorContent')}
      />
    );
  }

  return (
    <VirtualizedList
      data={items}
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
