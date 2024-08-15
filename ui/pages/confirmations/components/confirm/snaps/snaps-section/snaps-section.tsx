import React from 'react';
import { useSelector } from 'react-redux';
import { currentConfirmationSelector } from '../../../../selectors';
import { useInsightSnaps } from '../../../../../../hooks/snaps/useInsightSnaps';
import { Box } from '../../../../../../components/component-library';
import { SnapInsight } from '../snaps-insight';
import { Display, FlexDirection } from '../../../../../../helpers/constants/design-system';

export const SnapsSection = () => {
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const { data } = useInsightSnaps(currentConfirmation?.id);

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      {data.map(({ snapId, interfaceId, loading }) => (
        <SnapInsight key={snapId} snapId={snapId} interfaceId={interfaceId} loading={loading} />
      ))}
    </Box>
  );
};
