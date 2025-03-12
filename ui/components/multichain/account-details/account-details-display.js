import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import QrCodeView from '../../ui/qr-code-view';
import EditableLabel from '../../ui/editable-label/editable-label';

import { setAccountLabel } from '../../../store/actions';
import {
  getHardwareWalletType,
  getInternalAccountByAddress,
} from '../../../selectors';
import { isAbleToExportAccount } from '../../../helpers/utils/util';
import {
  Box,
  ButtonSecondary,
  ButtonSecondarySize,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
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
import { useEIP7702Account } from '../../../pages/confirmations/hooks/useEIP7702Account';

function SmartAccountPill() {
  const { isUpgraded } = useEIP7702Account();

  if (!isUpgraded) {
    return null;
  }

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      backgroundColor={BackgroundColor.backgroundAlternative}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.pill}
      margin={4}
      style={{
        padding: '0px 8px',
        flexShrink: 1,
        flexBasis: 'auto',
        minWidth: 0,
      }}
    >
      <Text
        ellipsis
        variant={TextVariant.bodyMd}
        color={TextColor.textAlternativeSoft}
      >
        Smart account
      </Text>
    </Box>
  );
}

function DowngradeAccountButton({ address, onClose }) {
  const { downgradeAccount, isUpgraded } = useEIP7702Account({
    onRedirect: onClose,
  });

  const handleClick = useCallback(() => {
    downgradeAccount(address);
  }, [address, downgradeAccount]);

  if (!isUpgraded) {
    return null;
  }

  return (
    <ButtonSecondary
      block
      size={ButtonSecondarySize.Lg}
      variant={TextVariant.bodyMd}
      marginBottom={4}
      onClick={handleClick}
    >
      Switch back to regular account
    </ButtonSecondary>
  );
}

export const AccountDetailsDisplay = ({
  accounts,
  accountName,
  address,
  onExportClick,
  onClose,
}) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  const {
    metadata: { keyring },
  } = useSelector((state) => getInternalAccountByAddress(state, address));
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
      <SmartAccountPill />
      <QrCodeView Qr={{ data: address }} />
      <DowngradeAccountButton address={address} onClose={onClose} />
      {exportPrivateKeyFeatureEnabled ? (
        <ButtonSecondary
          block
          size={ButtonSecondarySize.Lg}
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
  /**
   * Executes when closing the modal
   */
  onClose: PropTypes.func.isRequired,
};

DowngradeAccountButton.propTypes = {
  /**
   * Current address
   */
  address: PropTypes.string.isRequired,
  /**
   * Executes when closing the modal
   */
  onClose: PropTypes.func.isRequired,
};
