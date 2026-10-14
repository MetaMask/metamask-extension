import React from 'react';
import { useSelector } from 'react-redux';
import { getEnvironmentType } from '../../../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../../shared/constants/app';
import {
  HardwareTransportStates,
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
import { getLedgerTransportType } from '../../../../../ducks/metamask/base-selectors';
import {
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useLedgerConnection from '../../../hooks/useLedgerConnection';
import { useDispatch } from '../../../../../store/hooks';
import { isInE2eTest } from '../../../../../contexts/hardware-wallets/is-in-e2e-test';
import { requestWebHidDevices } from '../../../../../contexts/hardware-wallets/webConnectionUtils';
import { HardwareWalletType } from '../../../../../contexts/hardware-wallets/types';

const LedgerInfo = () => {
  const { isLedgerWallet } = useLedgerConnection();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const inE2eTest = isInE2eTest();
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
            onClick={async () => {
              if (environmentTypeIsFullScreen) {
                const connectedDevices = inE2eTest
                  ? []
                  : await requestWebHidDevices(HardwareWalletType.Ledger);
                dispatch(
                  setLedgerWebHidConnectedStatus(
                    inE2eTest || connectedDevices.length > 0
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
