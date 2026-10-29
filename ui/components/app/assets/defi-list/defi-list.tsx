import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import PulseLoader from '../../../ui/pulse-loader';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { VirtualizedList } from '../../../ui/virtualized-list/virtualized-list';
import { ASSET_CELL_HEIGHT } from '../constants';
import { DeFiErrorMessage } from './cells/defi-error-message';
import { DeFiEmptyStateMessage } from './cells/defi-empty-state';
import DefiProtocolCell from './cells/defi-protocol-cell';
import { type DefiPositionsList } from './useDefiPositionsList';

type DefiListProps = {
  items: DefiPositionsList;
  onClick: (chainId: string, protocolId: string) => void;
};

export default function DefiList({ items, onClick }: Readonly<DefiListProps>) {
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
        <DefiProtocolCell position={position} onClick={onClick} />
      )}
      listEmptyComponent={<DeFiEmptyStateMessage />}
    />
  );
}
