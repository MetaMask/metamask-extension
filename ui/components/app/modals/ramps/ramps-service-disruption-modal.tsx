import React from 'react';
import { Box, Text } from '../../../component-library';
import { TextVariant } from '../../../../helpers/constants/design-system';

// ponytail: stub — final copy/layout pending design sign-off (TRAM-3710 open Q1)
export default function RampsServiceDisruptionModal() {
  return (
    <Box padding={4} data-testid="ramps-service-disruption-modal">
      <Text variant={TextVariant.headingSm}>Buying is temporarily unavailable</Text>
      <Text variant={TextVariant.bodyMd}>
        We’re experiencing a service disruption. Please try again later.
      </Text>
    </Box>
  );
}
