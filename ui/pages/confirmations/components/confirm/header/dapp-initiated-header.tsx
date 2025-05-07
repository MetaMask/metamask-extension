import React from 'react';
import { Box, Text } from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AdvancedDetailsButton } from './advanced-details-button';

export const DAppInitiatedHeader = () => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      padding={3}
      style={{ zIndex: 2, position: 'relative' }}
    >
      <Text variant={TextVariant.headingMd} color={TextColor.inherit}>
        {t('transferRequest')}
      </Text>
      <Box
        paddingRight={3}
        style={{ marginLeft: 'auto', position: 'absolute', right: 0 }}
      >
        <AdvancedDetailsButton />
      </Box>
    </Box>
  );
};
