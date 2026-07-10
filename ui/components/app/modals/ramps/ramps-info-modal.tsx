import React from 'react';
import { Box, Text } from '../../../component-library';
import { TextVariant } from '../../../../helpers/constants/design-system';

// ponytail: stub — final copy/layout pending design sign-off (TRAM-3710 open Q1)
export default function RampsInfoModal({
  testId,
  title,
  body,
}: {
  testId: string;
  title: string;
  body: string;
}) {
  return (
    <Box padding={4} data-testid={testId}>
      <Text variant={TextVariant.headingSm}>{title}</Text>
      <Text variant={TextVariant.bodyMd}>{body}</Text>
    </Box>
  );
}
