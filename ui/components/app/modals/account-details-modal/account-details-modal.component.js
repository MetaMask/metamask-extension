import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';

import AccountModalContainer from '../account-modal-container';
import QrView from '../../../ui/qr-code';
import EditableLabel from '../../../ui/editable-label';
import Button from '../../../ui/button';
import { getURLHostName } from '../../../../helpers/utils/util';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import { NETWORKS_ROUTE } from '../../../../helpers/constants/routes';

export default class AccountDetailsModal extends Component {
  static propTypes = {
    selectedIdentity: PropTypes.object,
    chainId: PropTypes.string,
    showExportPrivateKeyModal: PropTypes.func,
    setAccountLabel: PropTypes.func,
    keyrings: PropTypes.array,
    rpcPrefs: PropTypes.object,
    accounts: PropTypes.array,
    history: PropTypes.object,
    hideModal: PropTypes.func,
    isCustomNetwork: PropTypes.bool,
    blockExplorerLinkText: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  render() {
    const {
      selectedIdentity,
      chainId,
      showExportPrivateKeyModal,
      setAccountLabel,
      keyrings,
      rpcPrefs,
      accounts,
      history,
      hideModal,
      isCustomNetwork,
      blockExplorerLinkText,
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
    // This feature is disabled for hardware wallets
    if (isHardwareKeyring(keyring?.type)) {
      exportPrivateKeyFeatureEnabled = false;
    }

    const routeToAddBlockExplorerUrl = () => {
      this.props.hideModal();
      history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
    }

    const openBlockExplorer = () => {
      const accountLink = getAccountLink(
        address,
        chainId,
        rpcPrefs,
      );
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
          onClick={
            // !rpcPrefs.blockExplorerUrl && isCustomNetwork
            //   ? () => {
            //       hideModal();
            //       history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
            //     }
            //   : () => {
            //       const accountLink = getAccountLink(
            //         address,
            //         chainId,
            //         rpcPrefs,
            //       );
            //       this.context.trackEvent({
            //         category: 'Navigation',
            //         event: 'Clicked Block Explorer Link',
            //         properties: {
            //           link_type: 'Account Tracker',
            //           action: 'Account Details Modal',
            //           block_explorer_domain: getURLHostName(accountLink),
            //         },
            //       });
            //       global.platform.openTab({
            //         url: accountLink,
            //       });
            //     }
            blockExplorerLinkText === this.context.t('addBlockExplorer') ? routeToAddBlockExplorerUrl : openBlockExplorer
          }
        >
          {/* {rpcPrefs.blockExplorerUrl &&
            this.context.t('blockExplorerView', [
              getURLHostName(rpcPrefs.blockExplorerUrl),
            ])}
          {!rpcPrefs.blockExplorerUrl &&
            isCustomNetwork &&
            this.context.t('addBlockExplorer')}
          {!rpcPrefs.blockExplorerUrl &&
            !isCustomNetwork &&
            this.context.t('etherscanViewOn')} */}
            {blockExplorerLinkText}
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
      </AccountModalContainer>
    );
  }
}
