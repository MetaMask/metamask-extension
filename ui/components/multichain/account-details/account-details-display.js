import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import QrCodeView from '../../ui/qr-code-view';
import EditableLabel from '../../ui/editable-label/editable-label';

import { setAccountLabel } from '../../../store/actions';
import {
  getHardwareWalletType,
  getInternalAccountByAddress,
  getMetaMaskKeyrings,
} from '../../../selectors';
import {
  isAbleToExportAccount,
  isAbleToRevealSrp,
  shortenString,
} from '../../../helpers/utils/util';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  Text,
} from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
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
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { SmartAccountTab } from '../../../pages/confirmations/components/confirm/smart-account-tab/smart-account-tab';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { Tab, Tabs } from '../../ui/tabs';

export const AccountDetailsDisplay = ({
  accounts,
  accountName,
  address,
  onExportClick,
}) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const checksummedAddress = toChecksumHexAddress(address)?.toLowerCase();
  const [copied, handleCopy] = useCopyToClipboard();
  const handleClick = useCallback(async () => {
    handleCopy(checksummedAddress);
  }, [checksummedAddress, handleCopy]);

  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const {
    metadata: { keyring },
  } = account;
  const exportPrivateKeyFeatureEnabled = isAbleToExportAccount(keyring?.type);
  const keyrings = useSelector(getMetaMaskKeyrings);
  const exportSrpFeatureEnabled = isAbleToRevealSrp(account, keyrings);

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
      <Box display={Display.Flex} style={{ position: 'relative' }}>
        <Text
          variant={TextVariant.bodyMd}
          data-testid="account-address-shortened"
          marginBottom={4}
        >
          {shortenString(checksummedAddress, {
            truncatedStartChars: 12,
            truncatedEndChars: 10,
          })}
        </Text>
        <ButtonIcon
          color={IconColor.iconAlternative}
          iconName={copied ? IconName.CopySuccess : IconName.Copy}
          size={ButtonIconSize.Md}
          style={{
            cursor: 'pointer',
            position: 'absolute',
            right: -32,
            top: -2,
          }}
          onClick={handleClick}
          ariaLabel="copy-button"
          data-testid="address-copy-button-text"
        />
      </Box>
      <Tabs
        onTabClick={() => undefined}
        style={{ width: '100%', marginTop: 8 }}
      >
        <Tab name="Type" tabKey="Type" style={{ width: '50%' }}>
          <SmartAccountTab address={address} />
        </Tab>
        <Tab name="Details" tabKey="Details" style={{ width: '50%' }}>
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
                    hd_entropy_index: hdEntropyIndex,
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
        </Tab>
      </Tabs>
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
