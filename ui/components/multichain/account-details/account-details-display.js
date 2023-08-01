import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import QrView from '../../ui/qr-code';
import EditableLabel from '../../ui/editable-label/editable-label';

import { setAccountLabel } from '../../../store/actions';
import {
  getCurrentChainId,
  getHardwareWalletType,
  getInternalAccount,
  getInternalAccounts,
} from '../../../selectors';
import { isAbleToExportAccount } from '../../../helpers/utils/util';
import {
  BUTTON_SECONDARY_SIZES,
  ButtonSecondary,
  Box,
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

export const AccountDetailsDisplay = ({
  accountName,
  accountId,
  onExportClick,
}) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  const displayedAccount = useSelector((state) =>
    getInternalAccount(state, accountId),
  );
  const { keyring } = displayedAccount.metadata;
  const { address } = displayedAccount;
  const accounts = useSelector(getInternalAccounts);
  const exportPrivateKeyFeatureEnabled = isAbleToExportAccount(keyring?.type);

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
          dispatch(setAccountLabel(accountId, label));
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
      <QrView Qr={{ data: address }} />
      {exportPrivateKeyFeatureEnabled ? (
        <ButtonSecondary
          block
          size={BUTTON_SECONDARY_SIZES.LG}
          variant={TextVariant.bodyMd}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.KeyExportSelected,
              properties: {
                key_type: MetaMetricsEventKeyType.Pkey,
                location: 'Account Details Modal',
              },
            });
            onExportClick();
          }}
        >
          {t('showPrivateKey')}
        </ButtonSecondary>
      ) : null}
    </Box>
  );
};

AccountDetailsDisplay.propTypes = {
  accountName: PropTypes.string.isRequired,
  accountId: PropTypes.string.isRequired,
  onExportClick: PropTypes.func.isRequired,
};
