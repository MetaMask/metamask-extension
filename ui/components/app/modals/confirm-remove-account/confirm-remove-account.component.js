import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEvmAccountType } from '@metamask/keyring-internal-api';
import { getMultichainAccountUrl } from '../../../../helpers/utils/multichain/blockExplorer';
import Modal from '../../modal';
import { addressSummary, getURLHostName } from '../../../../helpers/utils/util';
import Identicon from '../../../ui/identicon';
import { MetaMetricsEventCategory } from '../../../../../shared/constants/metametrics';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import {
  InternalAccountPropType,
  MultichainNetworkPropType,
} from '../../../../selectors/multichain';

export default class ConfirmRemoveAccount extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    removeAccount: PropTypes.func.isRequired,
    account: InternalAccountPropType.isRequired,
    network: MultichainNetworkPropType.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  handleRemove = () => {
    this.props
      .removeAccount(this.props.account.address)
      .then(() => this.props.hideModal());
  };

  handleCancel = () => {
    this.props.hideModal();
  };

  renderSelectedAccount() {
    const { t } = this.context;
    const { account, network } = this.props;

    return (
      <div className="confirm-remove-account__account">
        <div className="confirm-remove-account__account__identicon">
          <Identicon address={account.address} diameter={32} />
        </div>
        <div className="confirm-remove-account__account__name">
          <span className="confirm-remove-account__account__label">
            {t('name')}
          </span>
          <span className="account_value">{account.metadata.name}</span>
        </div>
        <div className="confirm-remove-account__account__address">
          <span className="confirm-remove-account__account__label">
            {t('publicAddress')}
          </span>
          <span className="account_value">
            {addressSummary(
              account.address,
              4,
              4,
              isEvmAccountType(account.type),
            )}
          </span>
        </div>
        <div className="confirm-remove-account__account__link">
          <a
            onClick={() => {
              const accountLink = getMultichainAccountUrl(
                account.address,
                network,
              );
              this.context.trackEvent({
                category: MetaMetricsEventCategory.Accounts,
                event: 'Clicked Block Explorer Link',
                properties: {
                  link_type: 'Account Tracker',
                  action: 'Remove Account',
                  block_explorer_domain: getURLHostName(accountLink),
                },
              });
              global.platform.openTab({
                url: accountLink,
              });
            }}
            target="_blank"
            rel="noopener noreferrer"
            title={t('etherscanView')}
            data-testid="explorer-link"
          >
            <i
              className="fa fa-share-square"
              style={{ color: 'var(--color-icon-muted)' }}
              title={t('etherscanView')}
            />
          </a>
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.context;

    return (
      <Modal
        headerText={`${t('removeAccount')}?`}
        onClose={this.handleCancel}
        onSubmit={this.handleRemove}
        onCancel={this.handleCancel}
        submitText={t('remove')}
        cancelText={t('nevermind')}
      >
        <div>
          {this.renderSelectedAccount()}
          <div className="confirm-remove-account__description">
            {t('removeAccountDescription')}
            <a
              className="confirm-remove-account__link"
              rel="noopener noreferrer"
              target="_blank"
              href={ZENDESK_URLS.IMPORTED_ACCOUNTS}
            >
              {t('learnMore')}
            </a>
          </div>
        </div>
      </Modal>
    );
  }
}
