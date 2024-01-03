import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { SubjectType } from '@metamask/permission-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import PermissionsConnectHeader from '../../../components/app/permissions-connect-header';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';
import AccountList from '../../../components/ui/account-list';
import { PageContainerFooter } from '../../../components/ui/page-container';

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
      accounts.map((account) => account.address),
    );
    setSelectedAccounts(newSelectedAccounts);
  };

  const deselectAll = () => {
    setSelectedAccounts(new Set());
  };

  const allAreSelected = () => {
    return accounts.length === selectedAccounts.size;
  };

  const getHeaderText = () => {
    if (accounts.length === 0) {
      return t('connectAccountOrCreate');
    }
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    if (targetSubjectMetadata?.subjectType === SubjectType.Snap) {
      return t('selectAccountsForSnap');
    }
    ///: END:ONLY_INCLUDE_IF

    return t('selectAccounts');
  };

  const headerText = getHeaderText();

  return (
    <>
      <div className="permissions-connect-choose-account__content">
        <PermissionsConnectHeader
          iconUrl={targetSubjectMetadata?.iconUrl}
          iconName={targetSubjectMetadata?.name}
          headerTitle={t('connectWithMetaMask')}
          headerText={headerText}
          siteOrigin={targetSubjectMetadata?.origin}
          subjectType={targetSubjectMetadata?.subjectType}
        />
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
      </div>
      <div className="permissions-connect-choose-account__footer-container">
        {targetSubjectMetadata?.subjectType !== SubjectType.Snap && (
          <PermissionsConnectFooter />
        )}
        <PageContainerFooter
          cancelButtonType="default"
          onCancel={() => cancelPermissionsRequest(permissionsRequestId)}
          cancelText={t('cancel')}
          onSubmit={() => selectAccounts(selectedAccounts)}
          submitText={t('next')}
          disabled={selectedAccounts.size === 0}
        />
      </div>
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
