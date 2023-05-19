import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';

import AccountModalContainer from '../account-modal-container';
import QrView from '../../../ui/qr-code';
import EditableLabel from '../../../ui/editable-label';
import Button from '../../../ui/button';
import { getURLHostName } from '../../../../helpers/utils/util';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import CustodyLabels from '../../../institutional/custody-labels/custody-labels';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';
///: END:ONLY_INCLUDE_IN
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventKeyType,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
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
    blockExplorerLinkText: PropTypes.object,
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    accountType: PropTypes.string,
    custodyAccountDetails: PropTypes.object,
    ///: END:ONLY_INCLUDE_IN
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
      history,
      hideModal,
      blockExplorerLinkText,
      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
      accountType,
      custodyAccountDetails,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;
    const { name, address } = selectedIdentity;

    const keyring = keyrings.find((kr) => {
      return kr.accounts.includes(address);
    });

    let exportPrivateKeyFeatureEnabled = true;
    // This feature is disabled for hardware wallets
    if (isHardwareKeyring(keyring?.type)) {
      exportPrivateKeyFeatureEnabled = false;
    }

    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    if (keyring?.type?.search('Custody') !== -1) {
      exportPrivateKeyFeatureEnabled = false;
    }
    const showCustodyLabels = accountType === 'custody';
    const custodyLabels = custodyAccountDetails
      ? custodyAccountDetails[toChecksumHexAddress(selectedIdentity.address)]
          ?.labels
      : {};
    ///: END:ONLY_INCLUDE_IN

    const routeToAddBlockExplorerUrl = () => {
      hideModal();
      history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
    };

    const openBlockExplorer = () => {
      const accountLink = getAccountLink(address, chainId, rpcPrefs);
      this.context.trackEvent({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.ExternalLinkClicked,
        properties: {
          link_type: MetaMetricsEventLinkType.AccountTracker,
          location: 'Account Details Modal',
          url_domain: getURLHostName(accountLink),
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
          defaultValue={name}
          onSubmit={(label) => setAccountLabel(address, label)}
          accounts={this.props.accounts}
        />
        {
          ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
          showCustodyLabels && <CustodyLabels labels={custodyLabels} />
          ///: END:ONLY_INCLUDE_IN
        }
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
          {this.context.t(blockExplorerLinkText.firstPart, [
            blockExplorerLinkText.secondPart,
          ])}
        </Button>

        {exportPrivateKeyFeatureEnabled && (
          <Button
            type="secondary"
            className="account-details-modal__button"
            onClick={() => {
              this.context.trackEvent({
                category: MetaMetricsEventCategory.Accounts,
                event: MetaMetricsEventName.KeyExportSelected,
                properties: {
                  key_type: MetaMetricsEventKeyType.Pkey,
                  location: 'Account Details Modal',
                },
              });
              showExportPrivateKeyModal();
            }}
          >
            {this.context.t('exportPrivateKey')}
          </Button>
        )}
      </AccountModalContainer>
    );
  }
}
