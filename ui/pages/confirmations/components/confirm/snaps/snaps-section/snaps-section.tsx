import React from 'react';
import { useInsightSnaps } from '../../../../../../hooks/snaps/useInsightSnaps';
import { Box } from '../../../../../../components/component-library/box/box';
import {
  Display,
  FlexDirection,
} from '../../../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../../../context/confirm';
import { mmLazy } from '../../../../../../helpers/utils/mm-lazy';

const SnapInsight = mmLazy(() => import('./snap-insight'));

export const SnapsSection = () => {
  const { currentConfirmation } = useConfirmContext();
  const { data } = useInsightSnaps(currentConfirmation?.id);

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
