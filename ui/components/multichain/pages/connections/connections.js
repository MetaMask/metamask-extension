import React from 'react';
import { Box, Text } from '../../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const Connections = () => {
  const t = useI18nContext();
  return (
    <Box
      data-testid="site-not-connected"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      height={BlockSize.Full}
      gap={2}
    >
      <Text>{t('metamaskNotConnected1')}</Text>
      <Text color={TextColor.textAlternative}>
        {t('metamaskNotConnected2')}{' '}
        <Text color={TextColor.textAlternative} as="strong">
          {t('metamaskNotConnected3')}
        </Text>
      </Text>
    </Box>
  );
};
