import React, { Component } from 'react'
import PropTypes from 'prop-types'
import copyToClipboard from 'copy-to-clipboard'
import classnames from 'classnames'

import AccountListItem from '../send/account-list-item/account-list-item.component'
import Button from '../../components/ui/button'
import Identicon from '../../components/ui/identicon'
import Tooltip from '../../components/ui/tooltip-v2'

import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import { conversionUtil } from '../../helpers/utils/conversion-util'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'

export default class ConfirmDecryptMessage extends Component {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    metricsEvent: PropTypes.func.isRequired,
  }

  static propTypes = {
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    clearConfirmTransaction: PropTypes.func.isRequired,
    cancelDecryptMessage: PropTypes.func.isRequired,
    decryptMessage: PropTypes.func.isRequired,
    decryptMessageInline: PropTypes.func.isRequired,
    conversionRate: PropTypes.number,
    history: PropTypes.object.isRequired,
    requesterAddress: PropTypes.string,
    txData: PropTypes.object,
    domainMetadata: PropTypes.object,
  }

  state = {
    fromAccount: this.props.fromAccount,
    copyToClipboardPressed: false,
    hasCopied: false,
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
    const { clearConfirmTransaction, cancelDecryptMessage } = this.props
    const { metricsEvent } = this.context
    metricsEvent({
      eventOpts: {
        category: 'Messages',
        action: 'Decrypt Message Request',
        name: 'Cancel Via Notification Close',
      },
    })
    clearConfirmTransaction()
    cancelDecryptMessage(event)
  }

  _removeBeforeUnload = () => {
    if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.removeEventListener('beforeunload', this._beforeUnload)
    }
  }

  copyMessage = () => {
    copyToClipboard(this.state.rawMessage)
    this.context.metricsEvent({
      eventOpts: {
        category: 'Messages',
        action: 'Decrypt Message Copy',
        name: 'Copy',
      },
    })
    this.setState({ hasCopied: true })
    setTimeout(() => this.setState({ hasCopied: false }), 3000)
  }

  renderHeader = () => {
    return (
      <div className="request-decrypt-message__header">
        <div className="request-decrypt-message__header-background" />

        <div className="request-decrypt-message__header__text">
          { this.context.t('decryptRequest') }
        </div>

        <div className="request-decrypt-message__header__tip-container">
          <div className="request-decrypt-message__header__tip" />
        </div>
      </div>
    )
  }

  renderAccount = () => {
    const { fromAccount } = this.state

    return (
      <div className="request-decrypt-message__account">
        <div className="request-decrypt-message__account-text">
          { `${this.context.t('account')}:` }
        </div>

        <div className="request-decrypt-message__account-item">
          <AccountListItem
            account={fromAccount}
            displayBalance={false}
          />
        </div>
      </div>
    )
  }

  renderBalance = () => {
    const { conversionRate } = this.props
    const { fromAccount: { balance } } = this.state

    const balanceInEther = conversionUtil(balance, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      numberOfDecimals: 6,
      conversionRate,
    })

    return (
      <div className="request-decrypt-message__balance">
        <div className="request-decrypt-message__balance-text">
          { `${this.context.t('balance')}:` }
        </div>
        <div className="request-decrypt-message__balance-value">
          { `${balanceInEther} ETH` }
        </div>
      </div>
    )
  }

  renderRequestIcon = () => {
    const { requesterAddress } = this.props

    return (
      <div className="request-decrypt-message__request-icon">
        <Identicon
          diameter={40}
          address={requesterAddress}
        />
      </div>
    )
  }

  renderAccountInfo = () => {
    return (
      <div className="request-decrypt-message__account-info">
        { this.renderAccount() }
        { this.renderRequestIcon() }
        { this.renderBalance() }
      </div>
    )
  }

  renderBody = () => {
    const { txData } = this.props

    const origin = this.props.domainMetadata[txData.msgParams.origin]
    const notice = this.context.t('decryptMessageNotice', [origin.name])

    const {
      hasCopied,
      hasDecrypted,
      hasError,
      rawMessage,
      errorMessage,
      copyToClipboardPressed,
    } = this.state

    return (
      <div className="request-decrypt-message__body">
        { this.renderAccountInfo() }
        <div
          className="request-decrypt-message__visual"
        >
          <section>
            {origin.icon ? (
              <img
                className="request-decrypt-message__visual-identicon"
                src={origin.icon}
              />
            ) : (
              <i className="request-decrypt-message__visual-identicon--default">
                {origin.name.charAt(0).toUpperCase()}
              </i>
            )}
            <div
              className="request-decrypt-message__notice"
            >
              { notice }
            </div>
          </section>
        </div>
        <div
          className="request-decrypt-message__message"
        >
          <div
            className="request-decrypt-message__message-text"
          >
            { !hasDecrypted && !hasError ? txData.msgParams.data : rawMessage }
            { !hasError ? '' : errorMessage }
          </div>
          <div
            className={classnames({
              'request-decrypt-message__message-cover': true,
              'request-decrypt-message__message-lock--pressed': hasDecrypted || hasError,
            })}
          >
          </div>
          <div
            className={classnames({
              'request-decrypt-message__message-lock': true,
              'request-decrypt-message__message-lock--pressed': hasDecrypted || hasError,
            })}
            onClick={(event) => {
              this.props.decryptMessageInline(txData, event).then((result) => {
                if (!result.error) {
                  this.setState({ hasDecrypted: true, rawMessage: result.rawData })
                } else {
                  this.setState({ hasError: true, errorMessage: this.context.t('decryptInlineError', [result.error]) })
                }
              })
            }}
          >
            <img src="images/lock.svg" />
            <div
              className="request-decrypt-message__message-lock-text"
            >
              {this.context.t('decryptMetamask')}
            </div>
          </div>
        </div>
        { hasDecrypted ?
          (
            <div
              className={classnames({
                'request-decrypt-message__message-copy': true,
                'request-decrypt-message__message-copy--pressed': copyToClipboardPressed,
              })}
              onClick={() => this.copyMessage()}
              onMouseDown={() => this.setState({ copyToClipboardPressed: true })}
              onMouseUp={() => this.setState({ copyToClipboardPressed: false })}
            >
              <Tooltip
                position="bottom"
                title={hasCopied ? this.context.t('copiedExclamation') : this.context.t('copyToClipboard')}
                wrapperClassName="request-decrypt-message__message-copy-tooltip"
              >
                <div
                  className="request-decrypt-message__message-copy-text"
                >
                  {this.context.t('decryptCopy')}
                </div>
                <img src="images/copy-to-clipboard.svg" />
              </Tooltip>
            </div>
          )
          :
          <div></div>
        }
      </div>
    )
  }

  renderFooter = () => {
    const { txData } = this.props

    return (
      <div className="request-decrypt-message__footer">
        <Button
          type="default"
          large
          className="request-decrypt-message__footer__cancel-button"
          onClick={async (event) => {
            this._removeBeforeUnload()
            await this.props.cancelDecryptMessage(txData, event)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Messages',
                action: 'Decrypt Message Request',
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
          className="request-decrypt-message__footer__sign-button"
          onClick={async (event) => {
            this._removeBeforeUnload()
            await this.props.decryptMessage(txData, event)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Messages',
                action: 'Decrypt Message Request',
                name: 'Confirm',
              },
            })
            this.props.clearConfirmTransaction()
            this.props.history.push(DEFAULT_ROUTE)
          }}
        >
          { this.context.t('decrypt') }
        </Button>
      </div>
    )
  }

  render = () => {
    return (
      <div className="request-decrypt-message__container">
        { this.renderHeader() }
        { this.renderBody() }
        { this.renderFooter() }
      </div>
    )
  }
}
