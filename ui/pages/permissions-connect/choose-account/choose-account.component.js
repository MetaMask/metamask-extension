import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classnames from 'classnames';
import Identicon from '../../../components/ui/identicon';
import Button from '../../../components/ui/button';
import CheckBox, {
  CHECKED,
  INDETERMINATE,
  UNCHECKED,
} from '../../../components/ui/check-box';
import Tooltip from '../../../components/ui/tooltip';
import { PRIMARY } from '../../../helpers/constants/common';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';
import PermissionsConnectHeader from '../../../components/app/permissions-connect-header';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';

export default class ChooseAccount extends Component {
  static propTypes = {
    accounts: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        addressLabel: PropTypes.string,
        lastConnectedDate: PropTypes.string,
        balance: PropTypes.string,
      }),
    ).isRequired,
    selectAccounts: PropTypes.func.isRequired,
    selectNewAccountViaModal: PropTypes.func.isRequired,
    nativeCurrency: PropTypes.string.isRequired,
    addressLastConnectedMap: PropTypes.object,
    cancelPermissionsRequest: PropTypes.func.isRequired,
    permissionsRequestId: PropTypes.string.isRequired,
    selectedAccountAddresses: PropTypes.object.isRequired,
    targetDomainMetadata: PropTypes.shape({
      extensionId: PropTypes.string,
      icon: PropTypes.string,
      host: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      origin: PropTypes.string.isRequired,
    }),
  };

  state = {
    selectedAccounts: this.props.selectedAccountAddresses,
  };

  static defaultProps = {
    addressLastConnectedMap: {},
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  handleAccountClick(address) {
    const { selectedAccounts } = this.state;

    const newSelectedAccounts = new Set(selectedAccounts);

    if (newSelectedAccounts.has(address)) {
      newSelectedAccounts.delete(address);
    } else {
      newSelectedAccounts.add(address);
    }

    this.setState({ selectedAccounts: newSelectedAccounts });
  }

  selectAll() {
    const { accounts } = this.props;

    const newSelectedAccounts = new Set(
      accounts.map((account) => account.address),
    );

    this.setState({ selectedAccounts: newSelectedAccounts });
  }

  deselectAll() {
    this.setState({ selectedAccounts: new Set() });
  }

  allAreSelected() {
    const { accounts } = this.props;
    const { selectedAccounts } = this.state;

    return accounts.every(({ address }) => selectedAccounts.has(address));
  }

  renderAccountsList = () => {
    const { accounts, nativeCurrency, addressLastConnectedMap } = this.props;
    const { selectedAccounts } = this.state;
    return (
      <div className="permissions-connect-choose-account__accounts-list">
        {accounts.map((account, index) => {
          const { address, addressLabel, balance } = account;
          return (
            <div
              key={`permissions-connect-choose-account-${index}`}
              onClick={() => this.handleAccountClick(address)}
              className="permissions-connect-choose-account__account"
            >
              <div className="permissions-connect-choose-account__account-info-wrapper">
                <CheckBox
                  className="permissions-connect-choose-account__list-check-box"
                  checked={selectedAccounts.has(address)}
                />
                <Identicon diameter={34} address={address} />
                <div className="permissions-connect-choose-account__account__info">
                  <div className="permissions-connect-choose-account__account__label">
                    {addressLabel}
                  </div>
                  <UserPreferencedCurrencyDisplay
                    className="permissions-connect-choose-account__account__balance"
                    type={PRIMARY}
                    value={balance}
                    style={{ color: '#6A737D' }}
                    suffix={nativeCurrency}
                  />
                </div>
              </div>
              {addressLastConnectedMap[address] ? (
                <Tooltip
                  title={`${this.context.t('lastConnected')} ${
                    addressLastConnectedMap[address]
                  }`}
                >
                  <i className="fa fa-info-circle" />
                </Tooltip>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  renderAccountsListHeader() {
    const { t } = this.context;
    const { selectNewAccountViaModal, accounts } = this.props;
    const { selectedAccounts } = this.state;

    let checked;
    if (this.allAreSelected()) {
      checked = CHECKED;
    } else if (selectedAccounts.size === 0) {
      checked = UNCHECKED;
    } else {
      checked = INDETERMINATE;
    }

    return (
      <div
        className={classnames({
          'permissions-connect-choose-account__accounts-list-header--one-item':
            accounts.length === 1,
          'permissions-connect-choose-account__accounts-list-header--two-items':
            accounts.length > 1,
        })}
      >
        {accounts.length > 1 ? (
          <div className="permissions-connect-choose-account__select-all">
            <CheckBox
              className="permissions-connect-choose-account__header-check-box"
              checked={checked}
              onClick={() =>
                this.allAreSelected() ? this.deselectAll() : this.selectAll()
              }
            />
            <div className="permissions-connect-choose-account__text-grey">
              {this.context.t('selectAll')}
            </div>
            <Tooltip
              position="bottom"
              html={
                <div style={{ width: 200, padding: 4 }}>
                  {t('selectingAllWillAllow')}
                </div>
              }
            >
              <i className="fa fa-info-circle" />
            </Tooltip>
          </div>
        ) : null}
        <div
          className="permissions-connect-choose-account__text-blue"
          onClick={() =>
            selectNewAccountViaModal(this.handleAccountClick.bind(this))
          }
        >
          {this.context.t('newAccount')}
        </div>
      </div>
    );
  }

  render() {
    const {
      selectAccounts,
      permissionsRequestId,
      cancelPermissionsRequest,
      targetDomainMetadata,
      accounts,
    } = this.props;
    const { selectedAccounts } = this.state;
    const { t } = this.context;
    return (
      <div className="permissions-connect-choose-account">
        <PermissionsConnectHeader
          icon={targetDomainMetadata.icon}
          iconName={targetDomainMetadata.name}
          headerTitle={t('connectWithMetaMask')}
          headerText={
            accounts.length > 0
              ? t('selectAccounts')
              : t('connectAccountOrCreate')
          }
          siteOrigin={targetDomainMetadata.origin}
        />
        {this.renderAccountsListHeader()}
        {this.renderAccountsList()}
        <div className="permissions-connect-choose-account__footer-container">
          <PermissionsConnectFooter />
          <div className="permissions-connect-choose-account__bottom-buttons">
            <Button
              onClick={() => cancelPermissionsRequest(permissionsRequestId)}
              type="default"
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
      </div>
    );
  }
}
