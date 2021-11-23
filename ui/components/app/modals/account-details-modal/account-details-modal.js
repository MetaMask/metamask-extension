import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { getAccountLink } from '@metamask/etherscan-link';
import { useHistory } from 'react-router-dom';

import AccountModalContainer from '../account-modal-container';
import QrView from '../../../ui/qr-code';
import EditableLabel from '../../../ui/editable-label';
import Button from '../../../ui/button';
import { getURLHostName } from '../../../../helpers/utils/util';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import { EVENT } from '../../../../../shared/constants/metametrics';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';
import {
  curriedGetEnsResolutionByAddress,
  getBlockExplorerLinkTextForAccountDetailsModal,
  getCurrentChainId,
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
  getRpcPrefsForCurrentProvider,
  getSelectedIdentity,
} from '../../../../selectors';
import {
  hideModal,
  setAccountLabel,
  showModal,
  tryReverseResolveAddress,
} from '../../../../store/actions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

export default function AccountDetailsModal() {
  const { name, address } = useSelector(getSelectedIdentity);
  const ensName = useSelector(curriedGetEnsResolutionByAddress(address));
  const keyrings = useSelector(getMetaMaskKeyrings);
  const chainId = useSelector(getCurrentChainId);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const blockExplorerLinkText = useSelector(
    getBlockExplorerLinkTextForAccountDetailsModal,
  );
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    if (address) {
      dispatch(tryReverseResolveAddress(address));
    }
  }, [address, dispatch]);

  const keyring = keyrings.find((kr) => {
    return kr.accounts.includes(address);
  });

  const getAccountsNames = (allAccounts, currentName) => {
    return Object.values(allAccounts)
      .map((item) => item.name)
      .filter((itemName) => itemName !== currentName);
  };

  let exportPrivateKeyFeatureEnabled = true;
  // This feature is disabled for hardware wallets
  if (isHardwareKeyring(keyring?.type)) {
    exportPrivateKeyFeatureEnabled = false;
  }

  const hasNickName = (accountLabel) => {
    const regExp = /Account [1-9][0-9]*$/u;
    return regExp.test(accountLabel);
  };

  const routeToAddBlockExplorerUrl = () => {
    dispatch(hideModal());
    history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

  const openBlockExplorer = () => {
    const accountLink = getAccountLink(address, chainId, rpcPrefs);
    trackEvent({
      category: EVENT.CATEGORIES.NAVIGATION,
      event: 'Clicked Block Explorer Link',
      properties: {
        link_type: 'Account Tracker',
        action: 'Account Details Modal',
        block_explorer_domain: getURLHostName(accountLink),
      },
    });
    global.platform.openTab({
      url: accountLink,
    });
  };

  return (
    <AccountModalContainer className="account-details-modal">
      <EditableLabel
        className="account-details-modal__name"
        defaultValue={hasNickName(name) ? ensName || name : name}
        onSubmit={(label) => dispatch(setAccountLabel(address, label))}
        accountsNames={getAccountsNames(accounts, name)}
      />

      <QrView
        Qr={{
          data: address,
        }}
      />

      <div className="account-details-modal__divider" />

      <Button
        type="secondary"
        className="account-details-modal__button"
        onClick={
          blockExplorerLinkText.firstPart === 'addBlockExplorer'
            ? routeToAddBlockExplorerUrl
            : openBlockExplorer
        }
      >
        {t(
          blockExplorerLinkText.firstPart,
          blockExplorerLinkText.secondPart === ''
            ? null
            : [blockExplorerLinkText.secondPart],
        )}
      </Button>

      {exportPrivateKeyFeatureEnabled ? (
        <Button
          type="secondary"
          className="account-details-modal__button"
          onClick={() => dispatch(showModal({ name: 'EXPORT_PRIVATE_KEY' }))}
        >
          {t('exportPrivateKey')}
        </Button>
      ) : null}
    </AccountModalContainer>
  );
}

AccountDetailsModal.contextTypes = {
  t: PropTypes.func,
  trackEvent: PropTypes.func,
};
