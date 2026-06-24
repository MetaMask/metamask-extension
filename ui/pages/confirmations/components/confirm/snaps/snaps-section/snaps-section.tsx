import React from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useInsightSnaps } from '../../../../../../hooks/snaps/useInsightSnaps';
import { useConfirmContext } from '../../../../context/confirm';
import { SnapInsight } from './snap-insight';

export const SnapsSection = () => {
  const { currentConfirmation } = useConfirmContext();
  const { data } = useInsightSnaps(currentConfirmation?.id);

  if (data.length === 0) {
    return null;
  }

  return (
    <Box
      className="flex"
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      marginBottom={4}
    >
      {data.map(({ snapId, interfaceId, loading }, index) => (
        <SnapInsight
          key={snapId}
          snapId={snapId}
          interfaceId={interfaceId}
          loading={loading}
          isExpanded={index === 0}
        />
      ))}
    </Box>
  );
};
