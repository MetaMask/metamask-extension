import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Select from 'react-select'
import getAccountLink from '../../../../lib/account-link'
import Button from '../../../components/ui/button'

class AccountList extends Component {
  getHdPaths() {
    return [
      {
        label: `Ledger Live`,
        value: `m/44'/60'/0'/0/0`,
      },
      {
        label: `Legacy (MEW / MyCrypto)`,
        value: `m/44'/60'/0'`,
      },
    ]
  }

  goToNextPage = () => {
    // If we have < 5 accounts, it's restricted by BIP-44
    if (this.props.accounts.length === 5) {
      this.props.getPage(this.props.device, 1, this.props.selectedPath)
    } else {
      this.props.onAccountRestriction()
    }
  }

  goToPreviousPage = () => {
    this.props.getPage(this.props.device, -1, this.props.selectedPath)
  }

  renderHdPathSelector() {
    const { onPathChange, selectedPath } = this.props

    const options = this.getHdPaths()
    return (
      <div>
        <h3 className="hw-connect__hdPath__title">
          {this.context.t('selectHdPath')}
        </h3>
        <p className="hw-connect__msg">{this.context.t('selectPathHelp')}</p>
        <div className="hw-connect__hdPath">
          <Select
            className="hw-connect__hdPath__select"
            name="hd-path-select"
            clearable={false}
            value={selectedPath}
            options={options}
            onChange={(opt) => {
              onPathChange(opt.value)
            }}
          />
        </div>
      </div>
    )
  }

  capitalizeDevice(device) {
    return device.slice(0, 1).toUpperCase() + device.slice(1)
  }

  renderHeader() {
    const { device } = this.props
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
    )
  }

  renderAccounts() {
    return (
      <div className="hw-account-list">
        {this.props.accounts.map((account, idx) => (
          <div className="hw-account-list__item" key={account.address}>
            <div className="hw-account-list__item__radio">
              <input
                type="radio"
                name="selectedAccount"
                id={`address-${idx}`}
                value={account.index}
                onChange={(e) => this.props.onAccountChange(e.target.value)}
                checked={
                  this.props.selectedAccount === account.index.toString()
                }
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
              href={getAccountLink(account.address, this.props.network)}
              target="_blank"
              rel="noopener noreferrer"
              title={this.context.t('etherscanView')}
            >
              <img src="images/popout.svg" alt="" />
            </a>
          </div>
        ))}
      </div>
    )
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
    )
  }

  renderButtons() {
    const disabled = this.props.selectedAccount === null
    const buttonProps = {}
    if (disabled) {
      buttonProps.disabled = true
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
          onClick={this.props.onUnlockAccount.bind(this, this.props.device)}
        >
          {this.context.t('unlock')}
        </Button>
      </div>
    )
  }

  renderForgetDevice() {
    return (
      <div className="hw-forget-device-container">
        <a onClick={this.props.onForgetDevice.bind(this, this.props.device)}>
          {this.context.t('forgetDevice')}
        </a>
      </div>
    )
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
    )
  }
}

AccountList.propTypes = {
  onPathChange: PropTypes.func.isRequired,
  selectedPath: PropTypes.string.isRequired,
  device: PropTypes.string.isRequired,
  accounts: PropTypes.array.isRequired,
  onAccountChange: PropTypes.func.isRequired,
  onForgetDevice: PropTypes.func.isRequired,
  getPage: PropTypes.func.isRequired,
  network: PropTypes.string,
  selectedAccount: PropTypes.string,
  onUnlockAccount: PropTypes.func,
  onCancel: PropTypes.func,
  onAccountRestriction: PropTypes.func,
}

AccountList.contextTypes = {
  t: PropTypes.func,
}

export default AccountList
