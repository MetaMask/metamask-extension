import { Box, Text } from '@metamask/design-system-react';
import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const Header = () => {
  const t = useI18nContext();

  return (
    <Box>
      <Text>{}</Text>
      <Text></Text>
    </Box>
  );
};
