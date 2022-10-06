import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { set } from 'lodash';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import PermissionsConnectHeader from '../../../../components/app/permissions-connect-header';
import PermissionsConnectFooter from '../../../../components/app/permissions-connect-footer';
import ChooseKeyringAccountsList from '../../../../components/app/flask/choose-keyring-accounts-list';
import { getSnaps } from '../../../../selectors';
import { PageContainerFooter } from '../../../../components/ui/page-container';

const ChooseKeyringAccounts = ({
  request,
  approveMultichainRequest,
  rejectMultichainRequest,
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const t = useI18nContext();
  const snaps = useSelector(getSnaps);

  const possibleAccounts = Object.entries(request.possibleAccounts);

  const handleAccountClick = (accountObj, isConflict) => {
    const newSelectedAccounts = { ...selectedAccounts };
    const { namespace, snapId, address } = accountObj;
    if (newSelectedAccounts[namespace]?.[snapId]?.[address]) {
      delete newSelectedAccounts[namespace][snapId][address];
    } else if (isConflict) {
      return;
    } else {
      set(newSelectedAccounts, [namespace, snapId, address], true);
    }
    setSelectedAccounts(newSelectedAccounts);
  };

  // TODO: memoize this based on namespace + chainId
  // Or we can just define the UI input as
  // Record<NamespaceId, {snapId: SnapId, accounts: { AccountId: string, suggestedChainName: string }[]}[]>
  const getChainName = (namespace, chainId, snapId) => {
    const snap = snaps[snapId];
    // TODO: Not safe, we should use the permissions directly!
    const { chains } =
      snap.initialPermissions['endowment:keyring'].namespaces[namespace];
    const matchingChain = chains.find((chain) => chain.id === chainId);
    return matchingChain.name;
  };

  // TODO: Use reduce?
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
          accountObj.suggestedChainNames.push(suggestedChainName);
        });
        accountObjects.push(accountObj);
      });
    });
    return accountObjects;
  };

  const resolvedAccounts = Object.entries(selectedAccounts).reduce(
    (acc, [namespaceId, snapObject]) => {
      const result = Object.entries(snapObject)
        .filter(([_, accountsObject]) => Object.keys(accountsObject).length > 0)
        .reduce(
          (_, [snapId, accountsObject]) => ({
            snapId,
            accounts: Object.keys(accountsObject),
          }),
          undefined,
        );

      if (result) {
        acc[namespaceId] = result;
      }
      return acc;
    },
    {},
  );

  const hasSelectedAccount = Object.keys(resolvedAccounts).length > 0;

  return (
    <>
      <div className="page-container permissions-connect-choose-keyring-accounts__content">
        <PermissionsConnectHeader
          iconName={request.metadata.origin}
          headerTitle={t('connectWithMetaMask')}
          headerText={t('selectKeyringAccounts', [request.metadata.origin])}
          siteOrigin={request.metadata.origin}
        />
        <ChooseKeyringAccountsList
          accounts={constructAccountObjects(possibleAccounts)}
          selectedAccounts={selectedAccounts}
          handleAccountClick={handleAccountClick}
        />
      </div>
      <div className="footers permissions-connect-choose-keyring-accounts__footer-container">
        <PermissionsConnectFooter />
        <PageContainerFooter
          cancelButtonType="secondary"
          onCancel={() => rejectMultichainRequest(request.metadata.id)}
          cancelText={t('cancel')}
          onSubmit={() =>
            approveMultichainRequest(request.metadata.id, resolvedAccounts)
          }
          submitText={t('connect')}
          disabled={!hasSelectedAccount}
        />
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
