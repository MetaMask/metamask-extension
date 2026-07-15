import React from 'react';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

// Stub — final copy/layout pending design sign-off (TRAM-3710 open Q1).
export default function RampsInfoModal({
  testId,
  titleKey,
  bodyKey,
}: {
  readonly testId: string;
  readonly titleKey: string;
  readonly bodyKey: string;
}) {
  const t = useI18nContext();
  return (
    <Box padding={4} data-testid={testId}>
      <Text variant={TextVariant.HeadingSm}>{t(titleKey)}</Text>
      <Text variant={TextVariant.BodyMd}>{t(bodyKey)}</Text>
    </Box>
  );
}
