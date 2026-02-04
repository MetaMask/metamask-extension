import React, { useMemo } from 'react';
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
export function OneKeyBridgeInstallationRequired() {
  const t = useI18nContext();

  const privacyLink = useMemo(
    () => (
      <Text
        as="a"
        href="https://help.onekey.so/hc/articles/9740566472335"
        target="_blank"
        rel="noopener noreferrer"
        key="privacy-link"
        color={TextColor.infoDefault}
      >
        {t('onekeyHardwareHelpLink')}
      </Text>
    ),
    [t],
  );

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
      data-testid="onekey-hardware-require-install-bridge"
    >
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {t('onekeyBridgeInstallationRequired', [privacyLink])}
      </Text>
      <Button
        variant={ButtonVariant.Primary}
        externalLink
        href="https://onekey.so/download/?client=bridge"
        type="primary"
      >
        {t('onekeyDownloadBridge')}
      </Button>
    </Box>
  );
}
