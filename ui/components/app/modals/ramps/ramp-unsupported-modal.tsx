import React from 'react';
import { Box, Text } from '../../../component-library';
import { TextVariant } from '../../../../helpers/constants/design-system';

// ponytail: stub — final copy/layout pending design sign-off (TRAM-3710 open Q1)
export default function RampUnsupportedModal() {
  return (
    <Box padding={4} data-testid="ramps-unsupported-modal">
      <Text variant={TextVariant.headingSm}>Buying isn’t available here</Text>
      <Text variant={TextVariant.bodyMd}>
        Buying crypto isn’t supported in your region yet.
      </Text>
    </Box>
  );
}
