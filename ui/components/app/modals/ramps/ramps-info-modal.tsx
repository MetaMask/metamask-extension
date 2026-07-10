import React from 'react';
import { Box, Text, TextVariant } from '@metamask/design-system-react';

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
      <Text variant={TextVariant.HeadingSm}>{title}</Text>
      <Text variant={TextVariant.BodyMd}>{body}</Text>
    </Box>
  );
}
