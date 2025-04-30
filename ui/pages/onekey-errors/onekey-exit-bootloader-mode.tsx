import React from 'react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
} from '../../components/component-library';
import {
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextColor,
} from '../../helpers/constants/design-system';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function OneKeyExitBootloaderMode() {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.flexStart}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.flexStart}
      gap={4}
      paddingLeft={8}
      paddingRight={8}
      paddingBottom={8}
      data-testid="notifications-settings-allow-notifications"
    >
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {t('onekeyExitBootloaderMode')}
      </Text>
      <Button
        variant={ButtonVariant.Primary}
        externalLink
        href="https://help.onekey.so/hc/articles/8352275268623"
        type="primary"
      >
        {t('onekeyHardwareHelpLink')}
      </Button>
    </Box>
  );
}
