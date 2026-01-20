import React from 'react';
// eslint-disable-next-line import/no-restricted-paths
import { DeviceStatus } from '@ledgerhq/device-management-kit';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../../shared/constants/app';
import {
  BannerAlert,
  BannerAlertSeverity,
  Button,
  ButtonVariant,
  Text,
} from '../../../../../components/component-library';
import {
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

import useLedgerDMK from '../../../hooks/useLedgerDMK';

const LedgerInfo: React.FC = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const inE2eTest =
    process.env.IN_TEST && process.env.JEST_WORKER_ID === 'undefined';
  const ledgerWebHidConnectedStatus = useSelector(
    getLedgerWebHidConnectedStatus,
  );
  const webHidConnectedStatus = inE2eTest
    ? WebHIDConnectedStatuses.connected
    : ledgerWebHidConnectedStatus;
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const transportStatus = useSelector(getLedgerTransportStatus);
  const environmentType = getEnvironmentType();
  const environmentTypeIsFullScreen =
    environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  if (!isLedgerWallet) {
    return null;
  }

  return (
    <BannerAlert severity={BannerAlertSeverity.Info} style={{ marginTop: 16 }}>
      <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Medium}>
        {t('ledgerConnectionInstructionHeader')}
      </Text>
      <ul style={{ listStyle: 'disc' }}>
        <li>
          <Text variant={TextVariant.bodyMd}>
            {t('ledgerConnectionInstructionStepThree')}
          </Text>
        </li>
        <li>
          <Text variant={TextVariant.bodyMd}>
            {t('ledgerConnectionInstructionStepFour')}
          </Text>
        </li>
      </ul>
      {deviceStatus === DeviceStatus.NOT_CONNECTED && (
        <Button
          variant={ButtonVariant.Link}
          textAlign={TextAlign.Left}
          fontWeight={FontWeight.Normal}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={async () => {
            if (environmentTypeIsFullScreen) {
              window.location.reload();
            } else {
              global.platform.openExtensionInBrowser?.(null, null, true);
            }
          }}
        >
          {t('ledgerConnectionInstructionCloseOtherApps')}
        </Button>
      )}
      {usingWebHID &&
        webHidConnectedStatus === WebHIDConnectedStatuses.notConnected && (
          <Button
            variant={ButtonVariant.Link}
            textAlign={TextAlign.Left}
            fontWeight={FontWeight.Normal}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={async () => {
              if (environmentTypeIsFullScreen) {
                let connectedDevices: HIDDevice[] = [];
                if (!inE2eTest) {
                  connectedDevices = await window.navigator.hid.requestDevice({
                    filters: [{ vendorId: Number(LEDGER_USB_VENDOR_ID) }],
                  });
                }
                const webHidIsConnected =
                  inE2eTest ||
                  connectedDevices.some(
                    (device) =>
                      device.vendorId === Number(LEDGER_USB_VENDOR_ID),
                  );
                dispatch(
                  setLedgerWebHidConnectedStatus(
                    webHidIsConnected
                      ? WebHIDConnectedStatuses.connected
                      : WebHIDConnectedStatuses.notConnected,
                  ),
                );
              } else {
                global.platform.openExtensionInBrowser?.(null, null, true);
              }
            }}
          >
            {environmentTypeIsFullScreen
              ? t('clickToConnectLedgerViaWebHID')
              : t('openFullScreenForLedgerWebHid')}
          </Button>
        )}
    </BannerAlert>
  );
};

export default LedgerInfo;
