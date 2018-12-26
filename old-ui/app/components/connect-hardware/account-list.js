import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ethNetProps from 'eth-net-props'
import { default as Select } from 'react-select'
import Button from '../../../../ui/app/components/button'
import { capitalizeFirstLetter } from '../../../../app/scripts/lib/util'
import { isLedger } from './util'

class AccountList extends Component {
    constructor (props, context) {
        super(props)
    }

    getHdPaths = () => {
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

    renderHdPathSelector = () => {
      const { onPathChange, selectedPath } = this.props

      const options = this.getHdPaths()
      return (
        <div>
          <h3 className="hw-connect__hdPath__title">Select HD Path</h3>
          <p className="hw-connect__msg">{`If you don't see your existing Ledger accounts below, try switching paths to "Legacy (MEW / MyCrypto)"`}</p>
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

    renderHeader = () => {
      const { device } = this.props
      return (
        <div className="hw-connect">
          <h3 className="hw-connect">
            <h3 className="hw-connect__unlock-title">{`Unlock ${capitalizeFirstLetter(device)}`}</h3>
            {device.toLowerCase() === 'ledger' ? this.renderHdPathSelector() : null}
            <p className="hw-connect__msg">Select the accounts to view in Nifty Wallet</p>
          </h3>
        </div>
      )
    }

    renderInput = (a, i) => {
      const { device } = this.props
      if (isLedger(device)) {
        return (
          <input
            type="checkbox"
            name={`selectedAccount-${i}`}
            id={`address-${i}`}
            value={a.index}
            onChange={(e) => this.props.onAccountChange(e.target.value)}
            checked={this.props.selectedAccounts.includes(a.index.toString())}
          />
        )
      } else {
        return (
          <input
            type="radio"
            name="selectedAccount"
            id={`address-${i}`}
            value={a.index}
            onChange={(e) => this.props.onAccountChange(e.target.value)}
            checked={this.props.selectedAccount === a.index.toString()}
          />
        )
      }
    }

    renderAccounts = () => {
      const rows = []
      this.props.accounts.forEach((a, i) => {
        rows.push(
          <div className="hw-account-list__item" key={a.address}>
            <div className="hw-account-list__item__radio">
              {this.renderInput(a, i)}
              <label className="hw-account-list__item__label" htmlFor={`address-${i}`}>
                {`${a.address.slice(0, 4)}...${a.address.slice(-4)}`}
                <span
                  className="hw-account-list__item__balance"
                  onClick={(event) => {
                    event.preventDefault()
                    global.platform.openWindow({
                        url: ethNetProps.explorerLinks.getExplorerAccountLinkFor(a.address, this.props.network),
                    })
                  }}
                >{`${a.balance}`}</span>
              </label>
            </div>
          </div>
        )
      })

      return (
        <div className="hw-account-list">{rows}</div>
      )
    }

  renderPagination = () => {
    return (
      <div className="hw-list-pagination">
        <button
          className="hw-list-pagination__button"
          onClick={this.goToNextPage}
        >{`Next >`}</button>
        <button
          className="hw-list-pagination__button"
          onClick={this.goToPreviousPage}
        >{`< Prev`}</button>
      </div>
    )
  }

  renderButtons = () => {
    const disabled = !this.props.selectedAccount && this.props.selectedAccounts.length === 0
    const buttonProps = {}
    if (disabled) {
      buttonProps.disabled = true
    }

    return (
      <div className="new-account-connect-form__buttons">
        <Button
          type="default"
          large={true}
          className="new-account-connect-form__button btn-violet"
          onClick={this.props.onCancel.bind(this)}
        >Cancel</Button>
        <Button
          type="primary"
          large={true}
          className="new-account-connect-form__button unlock"
          disabled={disabled}
          onClick={this.props.onUnlockAccount.bind(this, this.props.device)}
        >Unlock</Button>
      </div>
    )
  }

  renderForgetDevice = () => {
    return (
      <div className="hw-forget-device-container">
        <a onClick={this.props.onForgetDevice.bind(this, this.props.device)}>Forget this device</a>
      </div>
    )
  }

  render = () => {
    return (
      <div className="new-account-connect-form.account-list">
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
    selectedAccounts: PropTypes.array,
    history: PropTypes.object,
    onUnlockAccount: PropTypes.func,
    onCancel: PropTypes.func,
    onAccountRestriction: PropTypes.func,
}

module.exports = AccountList
