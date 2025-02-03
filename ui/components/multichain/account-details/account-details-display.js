import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import QrCodeView from '../../ui/qr-code-view';
import EditableLabel from '../../ui/editable-label/editable-label';

import {
  clearAccountDetails,
  setAccountDetailsAddress,
  setAccountLabel,
} from '../../../store/actions';
import {
  getHardwareWalletType,
  getInternalAccountByAddress,
} from '../../../selectors';
import { isAbleToExportAccount } from '../../../helpers/utils/util';
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
import { useEIP7702Account } from '../../../pages/confirmations/hooks/useEIP7702Account';
import { useAsyncResult } from '../../../hooks/useAsyncResult';
import Spinner from '../../ui/spinner';

export const AccountDetailsDisplay = ({
  accounts,
  accountName,
  address,
  onExportClick,
}) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleTransactionRedirect = useCallback(() => {
    dispatch(clearAccountDetails());
    dispatch(setAccountDetailsAddress(''));
  }, [dispatch]);

  const { hasDelegation, revokeDelegation, setDelegation } = useEIP7702Account({
    onRedirect: handleTransactionRedirect,
  });

  const { value: isAccountUpgraded } = useAsyncResult(
    () => hasDelegation(address),
    [address, hasDelegation],
  );

  const {
    metadata: { keyring },
  } = useSelector((state) => getInternalAccountByAddress(state, address));

  const exportPrivateKeyFeatureEnabled = isAbleToExportAccount(keyring?.type);
  const chainId = useSelector(getCurrentChainId);
  const deviceName = useSelector(getHardwareWalletType);

  const handleDowngradeClick = useCallback(async () => {
    setIsLoading(true);
    await revokeDelegation(address);
  }, [revokeDelegation, address]);

  const handleUpgradeClick = useCallback(async () => {
    setIsLoading(true);
    await setDelegation(address);
  }, [setDelegation, address]);

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
      {isLoading ? (
        <Spinner className="loading-overlay__spinner" />
      ) : (
        <>
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
          {isAccountUpgraded ? (
            <ButtonSecondary
              block
              size={ButtonSecondarySize.Lg}
              variant={TextVariant.bodyMd}
              marginTop={4}
              onClick={handleDowngradeClick}
            >
              Downgrade account
            </ButtonSecondary>
          ) : (
            <ButtonSecondary
              block
              size={ButtonSecondarySize.Lg}
              variant={TextVariant.bodyMd}
              marginTop={4}
              onClick={handleUpgradeClick}
            >
              Upgrade account
            </ButtonSecondary>
          )}
        </>
      )}
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
