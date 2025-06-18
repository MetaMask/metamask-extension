import React, { useContext } from 'react';
import { useSelector } from 'react-redux';

import QrCodeView from '../../ui/qr-code-view';

import {
  getInternalAccountByAddress,
  getMetaMaskKeyrings,
} from '../../../selectors';
import {
  isAbleToExportAccount,
  isAbleToRevealSrp,
} from '../../../helpers/utils/util';
import { ButtonSecondary, ButtonSecondarySize } from '../../component-library';
import { TextVariant } from '../../../helpers/constants/design-system';
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
  const {
    metadata: { keyring },
  } = account;
  const exportPrivateKeyFeatureEnabled = isAbleToExportAccount(keyring?.type);
  const keyrings = useSelector(getMetaMaskKeyrings);
  const exportSrpFeatureEnabled = isAbleToRevealSrp(account, keyrings);

  return (
    <>
      <QrCodeView Qr={{ data: address }} />
      {exportPrivateKeyFeatureEnabled ? (
        <ButtonSecondary
          data-testid="account-details-display-export-private-key"
          block
          size={ButtonSecondarySize.Lg}
          variant={TextVariant.bodyMd}
          marginBottom={1}
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
        </ButtonSecondary>
      ) : null}
      {exportSrpFeatureEnabled ? (
        <ButtonSecondary
          data-testid="account-details-display-export-srp"
          block
          size={ButtonSecondarySize.Lg}
          variant={TextVariant.bodyMd}
          onClick={() => {
            onExportClick('SRP');
          }}
        >
          {t('showSRP')}
        </ButtonSecondary>
      ) : null}
    </>
  );
};
