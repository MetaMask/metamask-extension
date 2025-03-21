import React, { useCallback, useContext } from 'react';
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
import { useAsyncResult } from '../../../hooks/useAsyncResult';

function SmartAccountPill({ address }) {
  const t = useI18nContext();
  const { isUpgraded } = useEIP7702Account();

  const { value: isAccountUpgraded } = useAsyncResult(
    () => isUpgraded(address),
    [address],
  );

  if (!isAccountUpgraded) {
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
        {t('confirmAccountTypeSmartContract')}
      </Text>
    </Box>
  );
}

function DowngradeAccountButton({ address, onClose }) {
  const t = useI18nContext();

  const { downgradeAccount, isUpgraded } = useEIP7702Account({
    onRedirect: onClose,
  });

  const { value: isAccountUpgraded } = useAsyncResult(
    () => isUpgraded(address),
    [address],
  );

  const handleClick = useCallback(async () => {
    await downgradeAccount(address);
  }, [address, downgradeAccount]);

  if (!isAccountUpgraded) {
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
      {t('accountDetailsRevokeDelegationButton')}
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

  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const {
    metadata: { keyring },
  } = account;
  const exportPrivateKeyFeatureEnabled = isAbleToExportAccount(keyring?.type);
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  const keyrings = useSelector(getMetaMaskKeyrings);
  const exportSrpFeatureEnabled = isAbleToRevealSrp(account, keyrings);
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
      <SmartAccountPill address={address} />
      <QrCodeView Qr={{ data: address }} />
      <DowngradeAccountButton address={address} onClose={onClose} />
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
        exportSrpFeatureEnabled ? (
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
  /**
   * Executes when closing the modal
   */
  onClose: PropTypes.func.isRequired,
};

SmartAccountPill.propTypes = {
  /**
   * Current address
   */
  address: PropTypes.string.isRequired,
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
