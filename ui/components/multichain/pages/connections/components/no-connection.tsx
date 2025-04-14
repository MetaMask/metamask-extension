// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Box, Text } from '../../../../component-library';

export const NoConnectionContent = () => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  return (
    <Box
      className="connections-page__no-site-connected-content"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      gap={2}
      paddingLeft={4}
      paddingRight={4}
    >
      <Text variant={TextVariant.bodyMdMedium} textAlign={TextAlign.Center}>
        {t('noConnectedAccountTitle')}
      </Text>

      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
        {t('noConnectionDescription')}
      </Text>
    </Box>
  );
};
