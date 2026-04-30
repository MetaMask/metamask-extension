import React, { useContext } from 'react';
import { useSelector } from 'react-redux';

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import QrCodeView from '../../ui/qr-code-view';

import {
  getInternalAccountByAddress,
  getMetaMaskKeyrings,
} from '../../../selectors';
import {
  isAbleToExportAccount,
  isAbleToRevealSrp,
} from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getHDEntropyIndex } from '../../../selectors/selectors';

export const AccountDetailsSection = ({
  address,
  onExportClick,
}: {
  address: string;
  onExportClick: (str: string) => void;
}) => {
  const { trackEvent } = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);

  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const exportPrivateKeyFeatureEnabled = isAbleToExportAccount(
    account?.metadata.keyring?.type,
  );
  const keyrings = useSelector(getMetaMaskKeyrings);
  const exportSrpFeatureEnabled = isAbleToRevealSrp(account, keyrings);

  return (
    <>
      <QrCodeView Qr={{ data: address }} />
      {exportPrivateKeyFeatureEnabled ? (
        <Button
          data-testid="account-details-display-export-private-key"
          size={ButtonSize.Lg}
          variant={ButtonVariant.Secondary}
          isFullWidth
          className="mb-1"
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.KeyExportSelected,
              properties: {
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                key_type: MetaMetricsEventKeyType.Pkey,
                location: 'Account Details Modal',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                hd_entropy_index: hdEntropyIndex,
              },
            });
            onExportClick('PrivateKey');
          }}
        >
          {t('showPrivateKey')}
        </Button>
      ) : null}
      {exportSrpFeatureEnabled ? (
        <Button
          data-testid="account-details-display-export-srp"
          size={ButtonSize.Lg}
          variant={ButtonVariant.Secondary}
          isFullWidth
          onClick={() => {
            onExportClick('SRP');
          }}
        >
          {t('showSRP')}
        </Button>
      ) : null}
    </>
  );
};
