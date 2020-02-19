import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import Identicon from '../../components/ui/identicon'
import AccountListItem from '../send/account-list-item/account-list-item.component'
import { conversionUtil } from '../../helpers/utils/conversion-util'
import Button from '../../components/ui/button'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'

export default class ConfirmEncryptionPublicKey extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    metricsEvent: PropTypes.func.isRequired,
  }

  static propTypes = {
    balance: PropTypes.string,
    clearConfirmTransaction: PropTypes.func.isRequired,
    cancelEncryptionPublicKey: PropTypes.func.isRequired,
    encryptionPublicKey: PropTypes.func.isRequired,
    conversionRate: PropTypes.number,
    history: PropTypes.object.isRequired,
    requesterAddress: PropTypes.string,
    selectedAccount: PropTypes.object,
    txData: PropTypes.object,
    domainMetadata: PropTypes.object,
  }

  state = {
    selectedAccount: this.props.selectedAccount,
  }

  componentDidMount = () => {
    if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.addEventListener('beforeunload', this._beforeUnload)
    }
  }

  componentWillUnmount = () => {
    this._removeBeforeUnload()
  }

  _beforeUnload = (event) => {
    const { clearConfirmTransaction, cancelEncryptionPublicKey } = this.props
    const { metricsEvent } = this.context
    metricsEvent({
      eventOpts: {
        category: 'Messages',
        action: 'Encryption public key Request',
        name: 'Cancel Via Notification Close',
      },
    })
    clearConfirmTransaction()
    cancelEncryptionPublicKey(event)
  }

  _removeBeforeUnload = () => {
    if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.removeEventListener('beforeunload', this._beforeUnload)
    }
  }

  renderHeader = () => {
    return (
      <div className="request-encryption-public-key__header">
        <div className="request-encryption-public-key__header-background" />

        <div className="request-encryption-public-key__header__text">
          { this.context.t('encryptionPublicKeyRequest') }
        </div>

        <div className="request-encryption-public-key__header__tip-container">
          <div className="request-encryption-public-key__header__tip" />
        </div>
      </div>
    )
  }

  renderAccount = () => {
    const { selectedAccount } = this.state

    return (
      <div className="request-encryption-public-key__account">
        <div className="request-encryption-public-key__account-text">
          { `${this.context.t('account')}:` }
        </div>

        <div className="request-encryption-public-key__account-item">
          <AccountListItem
            account={selectedAccount}
            displayBalance={false}
          />
        </div>
      </div>
    )
  }

  renderBalance = () => {
    const { balance, conversionRate } = this.props

    const balanceInEther = conversionUtil(balance, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      numberOfDecimals: 6,
      conversionRate,
    })

    return (
      <div className="request-encryption-public-key__balance">
        <div className="request-encryption-public-key__balance-text">
          { `${this.context.t('balance')}:` }
        </div>
        <div className="request-encryption-public-key__balance-value">
          { `${balanceInEther} ETH` }
        </div>
      </div>
    )
  }

  renderRequestIcon = () => {
    const { requesterAddress } = this.props

    return (
      <div className="request-encryption-public-key__request-icon">
        <Identicon
          diameter={40}
          address={requesterAddress}
        />
      </div>
    )
  }

  renderAccountInfo = () => {
    return (
      <div className="request-encryption-public-key__account-info">
        { this.renderAccount() }
        { this.renderRequestIcon() }
        { this.renderBalance() }
      </div>
    )
  }

  renderBody = () => {
    const { txData } = this.props

    const origin = this.props.domainMetadata[txData.origin]
    const notice = this.context.t('encryptionPublicKeyNotice', [origin.name])

    return (
      <div className="request-encryption-public-key__body">
        { this.renderAccountInfo() }
        <div
          className="request-encryption-public-key__visual"
        >
          <section>
            {origin.icon ? (
              <img
                className="request-encryption-public-key__visual-identicon"
                src={origin.icon}
              />
            ) : (
              <i className="request-encryption-public-key__visual-identicon--default">
                {origin.name.charAt(0).toUpperCase()}
              </i>
            )}
            <div
              className="request-encryption-public-key__notice"
            >
              { notice }
            </div>
          </section>
        </div>
      </div>
    )
  }

  renderFooter = () => {
    const { txData } = this.props

    return (
      <div className="request-encryption-public-key__footer">
        <Button
          type="default"
          large
          className="request-encryption-public-key__footer__cancel-button"
          onClick={async (event) => {
            this._removeBeforeUnload()
            await this.props.cancelEncryptionPublicKey(txData, event)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Messages',
                action: 'Encryption public key Request',
                name: 'Cancel',
              },
            })
            this.props.clearConfirmTransaction()
            this.props.history.push(DEFAULT_ROUTE)
          }}
        >
          { this.context.t('cancel') }
        </Button>
        <Button
          type="secondary"
          large
          className="request-encryption-public-key__footer__sign-button"
          onClick={async (event) => {
            this._removeBeforeUnload()
            await this.props.encryptionPublicKey(txData, event)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Messages',
                action: 'Encryption public key Request',
                name: 'Confirm',
              },
            })
            this.props.clearConfirmTransaction()
            this.props.history.push(DEFAULT_ROUTE)
          }}
        >
          { this.context.t('provide') }
        </Button>
      </div>
    )
  }

  render = () => {
    return (
      <div className="request-encryption-public-key__container">
        { this.renderHeader() }
        { this.renderBody() }
        { this.renderFooter() }
      </div>
    )
  }
}
