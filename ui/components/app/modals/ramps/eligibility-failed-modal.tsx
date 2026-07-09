import React from 'react';
import { Box, Text } from '../../../component-library';
import { TextVariant } from '../../../../helpers/constants/design-system';

// ponytail: stub — final copy/layout pending design sign-off (TRAM-3710 open Q1)
export default function EligibilityFailedModal() {
  return (
    <Box padding={4} data-testid="ramp-eligibility-failed-modal">
      <Text variant={TextVariant.headingSm}>We couldn’t verify your region</Text>
      <Text variant={TextVariant.bodyMd}>
        Please try again, or contact support if this keeps happening.
      </Text>
    </Box>
  );
}
