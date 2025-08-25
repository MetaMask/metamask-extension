import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';

import EditableLabel from '../../ui/editable-label/editable-label';

import { setAccountLabel } from '../../../store/actions';
import { getHardwareWalletType } from '../../../selectors';
import { shortenString } from '../../../helpers/utils/util';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { SmartAccountTab } from '../../../pages/confirmations/components/confirm/smart-account-tab/smart-account-tab';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useEIP7702Networks } from '../../../pages/confirmations/hooks/useEIP7702Networks';
import Preloader from '../../ui/icon/preloader';
import { Tab, Tabs } from '../../ui/tabs';
import { AccountDetailsSection } from './account-details-section';

export const AccountDetailsDisplay = ({
  accounts,
  accountName,
  address,
  accountType,
  onExportClick,
}) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const formatedAddress = isEvmAccountType(accountType)
    ? toChecksumHexAddress(address)?.toLowerCase()
    : address;
  const [copied, handleCopy] = useCopyToClipboard();
  const handleClick = useCallback(() => {
    handleCopy(formatedAddress);
  }, [formatedAddress, handleCopy]);
  const chainId = useSelector(getCurrentChainId);
  const deviceName = useSelector(getHardwareWalletType);
  const { networkSupporting7702Present, pending } = useEIP7702Networks(address);

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
          {shortenString(formatedAddress, {
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
      {pending && (
        <Box
          paddingTop={12}
          paddingBottom={12}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          data-testid="network-loader"
        >
          <Preloader size={18} />
        </Box>
      )}
      {!pending && networkSupporting7702Present && (
        <Tabs
          onTabClick={() => undefined}
          style={{ width: '100%', marginTop: '8px' }}
        >
          <Tab name="Type" tabKey="Type" style={{ width: '50%' }}>
            <SmartAccountTab address={address} />
          </Tab>
          <Tab name="Details" tabKey="Details" style={{ width: '50%' }}>
            <AccountDetailsSection
              address={address}
              onExportClick={onExportClick}
            />
          </Tab>
        </Tabs>
      )}
      {!pending && !networkSupporting7702Present && (
        <AccountDetailsSection
          address={address}
          onExportClick={onExportClick}
        />
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
   * Current account type
   */
  accountType: PropTypes.string.isRequired,
  /**
   * Executes upon Export button click
   */
  onExportClick: PropTypes.func.isRequired,
};
