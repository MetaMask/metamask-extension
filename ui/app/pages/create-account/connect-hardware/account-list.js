import PropTypes from 'prop-types';
import React, { Component } from 'react';
import getAccountLink from '../../../../lib/account-link';
import Button from '../../../components/ui/button';
import Checkbox from '../../../components/ui/check-box';
import Dropdown from '../../../components/ui/dropdown';

class AccountList extends Component {
  goToNextPage = () => {
    // If we have < 5 accounts, it's restricted by BIP-44
    if (this.props.accounts.length === 5) {
      this.props.getPage(this.props.device, 1, this.props.selectedPath);
    } else {
      this.props.onAccountRestriction();
    }
  };

  goToPreviousPage = () => {
    this.props.getPage(this.props.device, -1, this.props.selectedPath);
  };

  renderHdPathSelector() {
    const { onPathChange, selectedPath, hdPaths } = this.props;

    return (
      <div>
        <h3 className="hw-connect__hdPath__title">
          {this.context.t('selectHdPath')}
        </h3>
        <p className="hw-connect__msg">{this.context.t('selectPathHelp')}</p>
        <div className="hw-connect__hdPath">
          <Dropdown
            className="hw-connect__hdPath__select"
            options={hdPaths}
            selectedOption={selectedPath}
            onChange={(value) => {
              onPathChange(value);
            }}
          />
        </div>
      </div>
    );
  }

  capitalizeDevice(device) {
    return device.slice(0, 1).toUpperCase() + device.slice(1);
  }

  renderHeader() {
    const { device } = this.props;
    return (
      <div className="hw-connect">
        <h3 className="hw-connect__unlock-title">
          {`${this.context.t('unlock')} ${this.capitalizeDevice(device)}`}
        </h3>
        {device.toLowerCase() === 'ledger' ? this.renderHdPathSelector() : null}
        <h3 className="hw-connect__hdPath__title">
          {this.context.t('selectAnAccount')}
        </h3>
        <p className="hw-connect__msg">
          {this.context.t('selectAnAccountHelp')}
        </p>
      </div>
    );
  }

  renderAccounts() {
    const { accounts, connectedAccounts } = this.props;

    return (
      <div className="hw-account-list">
        {accounts.map((account, idx) => {
          const accountAlreadyConnected = connectedAccounts.includes(
            account.address.toLowerCase(),
          );
          const value = account.index;
          const checked =
            this.props.selectedAccounts.includes(account.index) ||
            accountAlreadyConnected;

          return (
            <div
              className="hw-account-list__item"
              key={account.address}
              title={
                accountAlreadyConnected
                  ? this.context.t('selectAnAccountAlreadyConnected')
                  : ''
              }
            >
              <div className="hw-account-list__item__checkbox">
                <Checkbox
                  id={`address-${idx}`}
                  checked={checked}
                  disabled={accountAlreadyConnected}
                  onClick={() => {
                    this.props.onAccountChange(value);
                  }}
                />
                <label
                  className="hw-account-list__item__label"
                  htmlFor={`address-${idx}`}
                >
                  <span className="hw-account-list__item__index">
                    {account.index + 1}
                  </span>
                  {`${account.address.slice(0, 4)}...${account.address.slice(
                    -4,
                  )}`}
                  <span className="hw-account-list__item__balance">{`${account.balance}`}</span>
                </label>
              </div>
              <a
                className="hw-account-list__item__link"
                href={getAccountLink(
                  account.address,
                  this.props.chainId,
                  this.props.rpcPrefs,
                )}
                target="_blank"
                rel="noopener noreferrer"
                title={this.context.t('etherscanView')}
              >
                <img src="images/popout.svg" alt="" />
              </a>
            </div>
          );
        })}
      </div>
    );
  }

  renderPagination() {
    return (
      <div className="hw-list-pagination">
        <button
          className="hw-list-pagination__button"
          onClick={this.goToPreviousPage}
        >
          {`< ${this.context.t('prev')}`}
        </button>
        <button
          className="hw-list-pagination__button"
          onClick={this.goToNextPage}
        >
          {`${this.context.t('next')} >`}
        </button>
      </div>
    );
  }

  renderButtons() {
    const disabled = this.props.selectedAccounts.length === 0;
    const buttonProps = {};
    if (disabled) {
      buttonProps.disabled = true;
    }

    return (
      <div className="new-external-account-form__buttons">
        <Button
          type="default"
          large
          className="new-external-account-form__button"
          onClick={this.props.onCancel.bind(this)}
        >
          {this.context.t('cancel')}
        </Button>
        <Button
          type="primary"
          large
          className="new-external-account-form__button unlock"
          disabled={disabled}
          onClick={this.props.onUnlockAccounts.bind(
            this,
            this.props.device,
            this.props.selectedPath,
          )}
        >
          {this.context.t('unlock')}
        </Button>
      </div>
    );
  }

  renderForgetDevice() {
    return (
      <div className="hw-forget-device-container">
        <a onClick={this.props.onForgetDevice.bind(this, this.props.device)}>
          {this.context.t('forgetDevice')}
        </a>
      </div>
    );
  }

  render() {
    return (
      <div className="new-external-account-form account-list">
        {this.renderHeader()}
        {this.renderAccounts()}
        {this.renderPagination()}
        {this.renderButtons()}
        {this.renderForgetDevice()}
      </div>
    );
  }
}

AccountList.propTypes = {
  onPathChange: PropTypes.func.isRequired,
  selectedPath: PropTypes.string.isRequired,
  device: PropTypes.string.isRequired,
  accounts: PropTypes.array.isRequired,
  connectedAccounts: PropTypes.array.isRequired,
  onAccountChange: PropTypes.func.isRequired,
  onForgetDevice: PropTypes.func.isRequired,
  getPage: PropTypes.func.isRequired,
  chainId: PropTypes.string,
  rpcPrefs: PropTypes.object,
  selectedAccounts: PropTypes.array.isRequired,
  onUnlockAccounts: PropTypes.func,
  onCancel: PropTypes.func,
  onAccountRestriction: PropTypes.func,
  hdPaths: PropTypes.array.isRequired,
};

AccountList.contextTypes = {
  t: PropTypes.func,
};

export default AccountList;
