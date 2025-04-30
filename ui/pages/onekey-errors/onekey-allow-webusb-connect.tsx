import React from 'react';
import { ONEKEY_WEBUSB_FILTER } from '@onekeyfe/hd-shared';
import { useHistory, useLocation } from 'react-router-dom';
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
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function OneKeyAllowWebUSBConnect() {
  const t = useI18nContext();

  const history = useHistory();
  const location = useLocation();
  // Previous page
  const previousPage = location.state?.fromPage;

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
        {t('onekeyWebUSBNotConnectedErrorMessage')}
      </Text>
      <Button
        variant={ButtonVariant.Primary}
        type="primary"
        onClick={async () => {
          const connectedDevice = await window.navigator.usb.requestDevice({
            filters: ONEKEY_WEBUSB_FILTER,
          });
          if (connectedDevice) {
            previousPage
              ? history.push(previousPage)
              : history.push(DEFAULT_ROUTE);
          }
        }}
      >
        {t('onekeyConnectDevice')}
      </Button>
    </Box>
  );
}
