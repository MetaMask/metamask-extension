import React from 'react';
import { Box, Text } from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NoTransactions() {
  const t = useI18nContext();
  return (
    <Box
      paddingTop={6}
      marginTop={12}
      marginBottom={12}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      className="nfts-tab__link"
    >
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
        textAlign={TextAlign.Center}
      >
        {t('noActivity')}
      </Text>
    </Box>
  );
}
