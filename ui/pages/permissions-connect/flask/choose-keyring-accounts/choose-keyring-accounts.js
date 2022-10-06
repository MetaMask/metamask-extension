import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Button from '../../../../components/ui/button';
import PermissionsConnectHeader from '../../../../components/app/permissions-connect-header';
import PermissionsConnectFooter from '../../../../components/app/permissions-connect-footer';
import ChooseKeyringAccountsList from '../../../../components/app/flask/choose-keyring-accounts-list';
import { getSnaps } from '../../../../selectors';

const ChooseKeyringAccounts = ({
  request,
  approveMultichainRequest,
  rejectMultichainRequest,
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState(null);
  const t = useI18nContext();
  const snaps = useSelector(getSnaps);

  const possibleAccounts = Object.entries(request.possibleAccounts);

  const handleAccountClick = (address) => {
    const newSelectedAccounts = new Set(selectedAccounts);
    if (newSelectedAccounts.has(address)) {
      newSelectedAccounts.delete(address);
    } else {
      newSelectedAccounts.add(address);
    }
    setSelectedAccounts(newSelectedAccounts);
  };

  const getChainName = (namespace, chainId, snapId) => {
    const snap = snaps[snapId];
    const { chains } =
      snap.initialPermissions['endowment:keyring'].namespaces[namespace];
    const matchingChain = chains.find((chain) => chain.id === chainId);
    return matchingChain.name;
  };

  const constructAccountObjects = (namespaceRecords) => {
    const accountObjects = [];
    namespaceRecords.forEach((namespaceRecord) => {
      const namespace = namespaceRecord[0];
      const namespaceAccounts = namespaceRecord[1];
      namespaceAccounts.forEach((namespaceAccount) => {
        const { snapId, accounts } = namespaceAccount;
        const accountObj = {};
        accountObj.suggestedChainNames = [];
        accountObj.snapId = snapId;
        accountObj.namespace = namespace;
        accounts.forEach((account) => {
          const splitId = account.split(':');
          const chainId = `${splitId[0]}:${splitId[1]}`;
          accountObj.address = splitId[2];
          const suggestedChainName = getChainName(namespace, chainId, snapId);
          account.suggestedChainNames.push(suggestedChainName);
        });
        accountObjects.push(accountObj);
      });
    });
    return accountObjects;
  };

  return (
    <>
      <div className="permissions-connect-choose-keyring-accounts__content">
        <PermissionsConnectHeader
          iconName={request.origin}
          headerTitle={t('connectWithMetaMask')}
          headerText={t('selectKeyringAccounts')}
          siteOrigin={request.origin}
        />
        <ChooseKeyringAccountsList
          accounts={constructAccountObjects(possibleAccounts)}
          selectedAccounts={selectedAccounts}
          handleAccountClick={handleAccountClick}
        />
      </div>
      <div className="permissions-connect-choose-keyring-account__footer-container">
        <PermissionsConnectFooter />
        <div className="permissions-connect-choose-keyring-account__bottom-buttons">
          <Button
            onClick={() => rejectMultichainRequest(request.metadata.id)}
            type="secondary"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={() => approveMultichainRequest(request.metadata.id)}
            type="primary"
            disabled={selectedAccounts.size === 0}
          >
            {t('connect')}
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
