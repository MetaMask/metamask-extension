import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { SubjectType } from '@metamask/permission-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';
import AccountList from '../../../components/ui/account-list';
import { PageContainerFooter } from '../../../components/ui/page-container';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../../components/component-library';

const ChooseAccount = ({
  selectedAccountAddresses,
  addressLastConnectedMap = {},
  accounts,
  selectAccounts,
  selectNewAccountViaModal,
  cancelPermissionsRequest,
  permissionsRequestId,
  targetSubjectMetadata,
  nativeCurrency,
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState(
    selectedAccountAddresses,
  );
  const evmAccounts = accounts.filter((account) =>
    isEvmAccountType(account.type),
  );
  const t = useI18nContext();

  const handleAccountClick = (address) => {
    const newSelectedAccounts = new Set(selectedAccounts);
    if (newSelectedAccounts.has(address)) {
      newSelectedAccounts.delete(address);
    } else {
      newSelectedAccounts.add(address);
    }
    setSelectedAccounts(newSelectedAccounts);
  };

  const selectAll = () => {
    const newSelectedAccounts = new Set(
      evmAccounts.map((account) => account.address),
    );
    setSelectedAccounts(newSelectedAccounts);
  };

  const deselectAll = () => {
    setSelectedAccounts(new Set());
  };

  const allAreSelected = () => {
    return evmAccounts.length === selectedAccounts.size;
  };

  // If lengths are different, this means `accounts` holds some non-EVM accounts
  const hasNonEvmAccounts =
    Object.keys(selectedAccountAddresses).length > evmAccounts.length;

  const getHeaderText = () => {
    if (accounts.length === 0) {
      return t('connectAccountOrCreate');
    }

    if (targetSubjectMetadata?.subjectType === SubjectType.Snap) {
      return t('selectAccountsForSnap');
    }

    return t('selectAccounts');
  };

  const headerText = getHeaderText();

  return (
    <>
      <Box
        className="permissions-connect-choose-account__content"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        backgroundColor={BackgroundColor.backgroundAlternative}
        width={BlockSize.Full}
        height={BlockSize.Full}
        paddingLeft={6}
        paddingRight={6}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          paddingTop={4}
          paddingBottom={4}
        >
          <Text variant={TextVariant.headingMd}>
            {t('connectWithMetaMask')}
          </Text>
          <Text variant={TextVariant.bodyMd}>{headerText}</Text>
        </Box>
        <AccountList
          accounts={accounts}
          selectNewAccountViaModal={selectNewAccountViaModal}
          addressLastConnectedMap={addressLastConnectedMap}
          nativeCurrency={nativeCurrency}
          selectedAccounts={selectedAccounts}
          allAreSelected={allAreSelected}
          deselectAll={deselectAll}
          selectAll={selectAll}
          handleAccountClick={handleAccountClick}
        />
      </Box>
      <Box
        backgroundColor={BackgroundColor.backgroundAlternative}
        className="permissions-connect-choose-account__footer"
        paddingTop={4}
      >
        {targetSubjectMetadata?.subjectType !== SubjectType.Snap && (
          <PermissionsConnectFooter />
        )}
        <PageContainerFooter
          cancelButtonType="default"
          onCancel={() => cancelPermissionsRequest(permissionsRequestId)}
          cancelText={t('cancel')}
          onSubmit={() => selectAccounts(selectedAccounts)}
          submitText={t('next')}
          disabled={hasNonEvmAccounts || selectedAccounts.size === 0}
        />
      </Box>
    </>
  );
};

ChooseAccount.propTypes = {
  /**
   * Array of user account objects
   */
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string,
      addressLabel: PropTypes.string,
      lastConnectedDate: PropTypes.string,
      balance: PropTypes.string,
    }),
  ).isRequired,
  /**
   * Function to select an account
   */
  selectAccounts: PropTypes.func.isRequired,
  /**
   * Function to select a new account via modal
   */
  selectNewAccountViaModal: PropTypes.func.isRequired,
  /**
   * Native currency of current chain
   */
  nativeCurrency: PropTypes.string.isRequired,
  /**
   * A map of the last connected addresses
   */
  addressLastConnectedMap: PropTypes.object,
  /**
   * Function to cancel permission request
   */
  cancelPermissionsRequest: PropTypes.func.isRequired,
  /**
   * Permission request Id
   */
  permissionsRequestId: PropTypes.string.isRequired,
  /**
   * Currently selected account addresses
   */
  selectedAccountAddresses: PropTypes.object.isRequired,
  /**
   * Domain data used to display site-origin pill
   */
  targetSubjectMetadata: PropTypes.shape({
    extensionId: PropTypes.string,
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string.isRequired,
    subjectType: PropTypes.string,
  }),
};

export default ChooseAccount;
