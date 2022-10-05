import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Button from '../../../../components/ui/button';
import PermissionsConnectHeader from '../../../../components/app/permissions-connect-header';
import PermissionsConnectFooter from '../../../../components/app/permissions-connect-footer';
import AccountList from '../../../../components/ui/account-list';

const ChooseKeyringAccounts = ({
  request,
  approveMultichainRequest,
  rejectMultichainRequest,
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState(null);
  const t = useI18nContext();

  // const handleAccountClick = (address) => {
  //   const newSelectedAccounts = new Set(selectedAccounts);
  //   if (newSelectedAccounts.has(address)) {
  //     newSelectedAccounts.delete(address);
  //   } else {
  //     newSelectedAccounts.add(address);
  //   }
  //   setSelectedAccounts(newSelectedAccounts);
  // };

  // const selectAll = () => {
  //   const newSelectedAccounts = new Set(
  //     accounts.map((account) => account.address),
  //   );
  //   setSelectedAccounts(newSelectedAccounts);
  // };

  // const deselectAll = () => {
  //   setSelectedAccounts(new Set());
  // };

  // const allAreSelected = () => {
  //   return accounts.length === selectedAccounts.size;
  // };

  return (
    <>
      <div className="permissions-connect-choose-account__content">
        <PermissionsConnectHeader
          iconName={request.origin}
          headerTitle={t('connectWithMetaMask')}
          headerText={t('selectMultichainAccounts')}
          siteOrigin={request.origin}
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
        <PermissionsConnectFooter />
        <div className="permissions-connect-choose-account__bottom-buttons">
          <Button
            onClick={() => cancelPermissionsRequest(permissionsRequestId)}
            type="secondary"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={() => selectAccounts(selectedAccounts)}
            type="primary"
            disabled={selectedAccounts.size === 0}
          >
            {t('next')}
          </Button>
        </div>
      </div>
    </>
  );
};

ChooseKeyringAccounts.propTypes = {
  /**
   * Function to choose multichain accounts
   */
  approveMultichainRequest: PropTypes.func.isRequired,
  /**
   * Function to cancel a multichain request
   */
  rejectMultichainRequest: PropTypes.func.isRequired,
  /**
   * Approval request object
   */
  request: PropTypes.object.isRequired,
};

export default ChooseKeyringAccounts;
