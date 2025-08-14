import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { HardwareErrorCode } from '@onekeyfe/hd-shared';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  Box,
  IconName,
  ButtonIcon,
  ButtonIconSize,
} from '../../components/component-library';
import {
  Display,
  JustifyContent,
  AlignItems,
} from '../../helpers/constants/design-system';

import { Content, Header, Page } from '../../components/multichain/pages/page';
import { getTheme } from '../../selectors';
import MetaFoxLogo from '../../components/ui/metafox-logo';
import { OneKeyAllowWebUSBConnect } from './onekey-allow-webusb-connect';
import { OneKeyBridgeInstallationRequired } from './onekey-require-install-bridge';
import { OneKeyForceUpdateFirmware } from './onekey-force-update-firmware';
import { OneKeyUpdateFirmware } from './onekey-update-firmware';
import { OneKeyExitBootloaderMode } from './onekey-exit-bootloader-mode';
import { OneKeyCommonError } from './onekey-common-error';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OneKeyErrors() {
  const history = useHistory();
  const location = useLocation();
  const t = useI18nContext();
  const { error } = useParams<{ error: string }>();

  // Previous page
  const previousPage = location.state?.fromPage;

  const theme = useSelector((state) => getTheme(state));

  const contentView = useMemo(() => {
    switch (error) {
      case HardwareErrorCode.WebDeviceNotFoundOrNeedsPermission.toString():
        return (
          <OneKeyAllowWebUSBConnect data-testid="onekey-allow-webusb-connect" />
        );
      case HardwareErrorCode.BridgeNotInstalled.toString():
        return (
          <OneKeyBridgeInstallationRequired data-testid="onekey-allow-webusb-connect" />
        );
      case HardwareErrorCode.NewFirmwareForceUpdate.toString():
        return (
          <OneKeyForceUpdateFirmware data-testid="onekey-force-update-firmware" />
        );
      case HardwareErrorCode.CallMethodNeedUpgradeFirmware.toString():
        return (
          <OneKeyUpdateFirmware data-testid="onekey-need-update-firmware" />
        );
      case HardwareErrorCode.NotAllowInBootloaderMode.toString():
        return (
          <OneKeyExitBootloaderMode data-testid="onekey-exit-bootloader-mode" />
        );
      case HardwareErrorCode.DeviceCheckPassphraseStateError.toString():
      case HardwareErrorCode.DeviceCheckUnlockTypeError.toString():
        return (
          <OneKeyCommonError
            error={t('onekeyDeviceCheckPassphraseStateError')}
          />
        );
      case HardwareErrorCode.SelectDevice.toString():
        return <OneKeyCommonError error={t('onekeyDeviceOnlyOneError')} />;
      default:
        return null;
    }
  }, [error, t]);

  return (
    <div className="main-container" data-testid="onekey-errors-page">
      <Box
        display={[Display.None, Display.Flex]}
        alignItems={AlignItems.center}
        margin={2}
        className="multichain-app-header-logo"
        data-testid="app-header-logo"
        justifyContent={JustifyContent.center}
      >
        <MetaFoxLogo
          unsetIconHeight
          onClick={() => history.push(DEFAULT_ROUTE)}
          theme={theme}
        />
      </Box>

      <Page>
        <Header
          startAccessory={
            <ButtonIcon
              ariaLabel="Back"
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Sm}
              onClick={() =>
                previousPage
                  ? history.push(previousPage)
                  : history.push(DEFAULT_ROUTE)
              }
            />
          }
          endAccessory={null}
        >
          {t('onekeyHardwareError')}
        </Header>
        <Content padding={0}>{contentView}</Content>
      </Page>
    </div>
  );
}
