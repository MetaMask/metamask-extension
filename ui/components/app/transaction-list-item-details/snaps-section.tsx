import React from 'react';
import { useInsightSnaps } from '../../../hooks/snaps/useInsightSnaps';
import { Box } from '../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { SnapInsight } from './snap-insight';

export const SnapsSection = ({ transactionId }: { transactionId: string }) => {
  const { data } = useInsightSnaps(transactionId);

  if (data.length === 0) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
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
