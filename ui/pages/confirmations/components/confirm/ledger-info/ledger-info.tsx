import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../../shared/constants/app';
import {
  HardwareTransportStates,
  LEDGER_USB_VENDOR_ID,
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../../../shared/constants/hardware-wallets';
import {
  BannerAlert,
  BannerAlertSeverity,
  Button,
  ButtonVariant,
  Text,
} from '../../../../../components/component-library';
import {
  getLedgerTransportStatus,
  getLedgerWebHidConnectedStatus,
  setLedgerWebHidConnectedStatus,
} from '../../../../../ducks/app/app';
import { getLedgerTransportType } from '../../../../../ducks/metamask/metamask';
import {
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useLedgerConnection from '../../../hooks/useLedgerConnection';

const LedgerInfo: React.FC = () => {
  const { isLedgerWallet } = useLedgerConnection();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const inE2eTest =
    process.env.IN_TEST && process.env.JEST_WORKER_ID === 'undefined';
  const webHidConnectedStatus = inE2eTest
    ? WebHIDConnectedStatuses.connected
    : useSelector(getLedgerWebHidConnectedStatus);
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const transportStatus = useSelector(getLedgerTransportStatus);
  const environmentType = getEnvironmentType();
  const environmentTypeIsFullScreen =
    environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  if (!isLedgerWallet) {
    return null;
  }

  const usingWebHID = ledgerTransportType === LedgerTransportTypes.webhid;

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
      {transportStatus === HardwareTransportStates.deviceOpenFailure && (
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
