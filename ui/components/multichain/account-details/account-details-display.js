import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import QrCodeView from '../../ui/qr-code-view';
import EditableLabel from '../../ui/editable-label/editable-label';

import { setAccountLabel } from '../../../store/actions';
import {
  getHardwareWalletType,
  getInternalAccountByAddress,
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  getMetaMaskKeyrings,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import {
  isAbleToExportAccount,
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  isAbleToRevealSrp,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/utils/util';
import {
  Box,
  ButtonSecondary,
  ButtonSecondarySize,
} from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';

export const AccountDetailsDisplay = ({
  accounts,
  accountName,
  address,
  onExportClick,
}) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const {
    metadata: { keyring },
  } = account;
  const exportPrivateKeyFeatureEnabled = isAbleToExportAccount(keyring?.type);
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  const keyrings = useSelector(getMetaMaskKeyrings);
  const exportSRPFeatureEnabled = isAbleToRevealSrp(account, keyrings);
  ///: END:ONLY_INCLUDE_IF

  const chainId = useSelector(getCurrentChainId);
  const deviceName = useSelector(getHardwareWalletType);

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
    >
      <EditableLabel
        defaultValue={accountName}
        onSubmit={(label) => {
          dispatch(setAccountLabel(address, label));
          trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.AccountRenamed,
            properties: {
              location: 'Account Details Modal',
              chain_id: chainId,
              account_hardware_type: deviceName,
            },
          });
        }}
        accounts={accounts}
      />
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
                key_type: MetaMetricsEventKeyType.Pkey,
                location: 'Account Details Modal',
              },
            });
            onExportClick('PrivateKey');
          }}
        >
          {t('showPrivateKey')}
        </ButtonSecondary>
      ) : null}
      {
        ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
        exportSRPFeatureEnabled ? (
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
        ) : null
        ///: END:ONLY_INCLUDE_IF
      }
    </Box>
  );
};

AccountDetailsDisplay.propTypes = {
  /**
   * Array of user accounts
   */
  accounts: PropTypes.array.isRequired,
  /**
   * Name of the current account
   */
  accountName: PropTypes.string.isRequired,
  /**
   * Current address
   */
  address: PropTypes.string.isRequired,
  /**
   * Executes upon Export button click
   */
  onExportClick: PropTypes.func.isRequired,
};
