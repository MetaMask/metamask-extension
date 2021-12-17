import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';

import AccountModalContainer from '../account-modal-container';
import QrView from '../../../ui/qr-code';
import EditableLabel from '../../../ui/editable-label';
import Button from '../../../ui/button';
import { getURLHostName } from '../../../../helpers/utils/util';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';

export default class AccountDetailsModal extends Component {
  static propTypes = {
    selectedIdentity: PropTypes.object,
    isWatchOnly: PropTypes.bool,
    chainId: PropTypes.string,
    showExportPrivateKeyModal: PropTypes.func,
    showStopWatchingModal: PropTypes.func,
    setAccountLabel: PropTypes.func,
    keyrings: PropTypes.array,
    rpcPrefs: PropTypes.object,
    accounts: PropTypes.array,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  render() {
    const {
      selectedIdentity,
      isWatchOnly,
      chainId,
      showExportPrivateKeyModal,
      showStopWatchingModal,
      setAccountLabel,
      keyrings,
      rpcPrefs,
      accounts,
    } = this.props;
    const { name, address } = selectedIdentity;

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(address);
    });

    const getAccountsNames = (allAccounts, currentName) => {
      return Object.values(allAccounts)
        .map((item) => item.name)
        .filter((itemName) => itemName !== currentName);
    };

    let exportPrivateKeyFeatureEnabled = true;
    // This feature is disabled for hardware wallets and watch only accounts
    if (isHardwareKeyring(keyring?.type) || isWatchOnly) {
      exportPrivateKeyFeatureEnabled = false;
    }

    return (
      <AccountModalContainer className="account-details-modal">
        <EditableLabel
          className="account-details-modal__name"
          defaultValue={name}
          onSubmit={(label) => setAccountLabel(address, label)}
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
          onClick={() => {
            const accountLink = getAccountLink(address, chainId, rpcPrefs);
            this.context.trackEvent({
              category: 'Navigation',
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
          }}
        >
          {rpcPrefs.blockExplorerUrl
            ? this.context.t('blockExplorerView', [
                getURLHostName(rpcPrefs.blockExplorerUrl),
              ])
            : this.context.t('etherscanViewOn')}
        </Button>

        {exportPrivateKeyFeatureEnabled ? (
          <Button
            type="secondary"
            className="account-details-modal__button"
            onClick={() => showExportPrivateKeyModal()}
          >
            {this.context.t('exportPrivateKey')}
          </Button>
        ) : null}

        {isWatchOnly ? (
          <Button
            type="secondary"
            className="account-details-modal__button--red"
            onClick={() => showStopWatchingModal(address)}
          >
            {this.context.t('stopWatching')}
          </Button>
        ) : null}
      </AccountModalContainer>
    );
  }
}
