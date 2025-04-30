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

  const { isLedgerWallet, deviceStatus } = useLedgerDMK();

  // Determine environment type directly instead of using the restricted import
  const environmentTypeIsFullScreen = window.innerHeight > 600;

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
      {deviceStatus === DeviceStatus.NOT_CONNECTED && (
        <Button
          variant={ButtonVariant.Link}
          textAlign={TextAlign.Left}
          fontWeight={FontWeight.Normal}
          onClick={async () => {
            //TODO
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
