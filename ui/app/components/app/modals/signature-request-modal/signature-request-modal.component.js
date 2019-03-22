import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ethUtil from 'ethereumjs-util'
import classnames from 'classnames'
import { ObjectInspector } from 'react-inspector'

import Identicon from '../../../ui/identicon'
import AccountDropdownMini from '../../../ui/account-dropdown-mini'
import Button from '../../../ui/button'

export default class SignatureRequestModal extends Component {

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    signPersonalMessage: PropTypes.func,
    signTypedMessage: PropTypes.func,
    cancelPersonalMessage: PropTypes.func,
    cancelTypedMessage: PropTypes.func,
    signMessage: PropTypes.func,
    cancelMessage: PropTypes.func,
    hideModal: PropTypes.func,
    requesterAddress: PropTypes.string,
    txData: PropTypes.object,
    selectedAccount: PropTypes.object,
    accounts: PropTypes.array,
  }

  state = {
    selectedAccount: this.props.selectedAccount,
  }

  renderHeader () {
    return <div className="request-signature__header">

      <div className="request-signature__header-background" />

      <div className="request-signature__header__text">{ this.context.t('sigRequest') }</div>

      <div className="request-signature__header__tip-container">
        <div className="request-signature__header__tip" />
      </div>

    </div>
  }

  renderAccountDropdown () {
    const { selectedAccount } = this.state

    const {
      accounts,
    } = this.props

    return <div className="request-signature__account">

      <div className="request-signature__account-text">
        { this.context.t('account') + ':' }
      </div>

      <AccountDropdownMini
        selectedAccount={selectedAccount}
        accounts={accounts}
        disabled={true}
      />

    </div>
  }

  renderBalance () {
    return <div className="request-signature__balance">

      <div className="request-signature__balance-text">{ `${this.context.t('balance')}:` }</div>

      <div className="request-signature__balance-value">{ `${1} ETH` }</div>

    </div>
  }

  renderAccountInfo () {
    return <div className="request-signature__account-info">
      { this.renderAccountDropdown() }
      { this.renderRequestIcon() }
      { this.renderBalance() }
    </div>
  }

  renderRequestIcon () {
    const { requesterAddress } = this.props

    return <div className="request-signature__request-icon">
      <Identicon diameter={40} address={requesterAddress} />
    </div>
  }

  renderRequestInfo () {
    return <div className="request-signature__request-info">

      <div className="request-signature__headline">
        { this.context.t('yourSigRequested') }
      </div>

    </div>
  }

  msgHexToText (hex) {
    try {
      const stripped = ethUtil.stripHexPrefix(hex)
      const buff = Buffer.from(stripped, 'hex')
      return buff.length === 32 ? hex : buff.toString('utf8')
    } catch (e) {
      return hex
    }
  }

  renderTypedDataV3 (data) {
    const { domain, message } = JSON.parse(data)
    return <div className="request-signature__typed-container">
      {domain
        ? <div>
          <h1>Domain</h1>
          <ObjectInspector
            data={domain}
            expandLevel={1}
            name="domain"
          />
        </div>
        : ''
      }
      {message
        ? <div>
          <h1>Message</h1>
          <ObjectInspector
            data={message}
            expandLevel={1}
            name="message"
          />
        </div>
        : ''
      }
    </div>
  }

  renderBody () {
    let rows
    let notice = this.context.t('youSign') + ':'

    const { txData } = this.props
    const { type, msgParams: { data, version } } = txData

    if (type === 'personal_sign') {
      rows = [{ name: this.context.t('message'), value: this.msgHexToText(data) }]
    } else if (type === 'eth_signTypedData') {
      rows = data
    } else if (type === 'eth_sign') {
      rows = [{ name: this.context.t('message'), value: data }]
      notice = [this.context.t('signNotice'),
        <span
          key="request-signature__help-link "
          className="request-signature__help-link"
          onClick={() => {
            global.platform.openWindow({
              url: 'https://metamask.zendesk.com/hc/en-us/articles/360015488751',
            })
          }}
        >
          { this.context.t('learnMore') }
        </span>,
    ]
   }

    return <div className="request-signature__body">
      { this.renderAccountInfo() }
      { this.renderRequestInfo() }
      <div
        className={classnames('request-signature__notice', {
          'request-signature__notice': type === 'personal_sign' || type === 'eth_signTypedData',
          'request-signature__warning': type === 'eth_sign',
        })}
      >
       { notice }
      </div>
      <div className="request-signature__rows">
        {type === 'eth_signTypedData' && version === 'V3'
          ? this.renderTypedDataV3(data)
          : rows.map(({ name, value }) => {
            if (typeof value === 'boolean') {
              value = value.toString()
            }
            return <div className="request-signature__row" key={`request-signature-row$-{name}`}>
              <div className="request-signature__row-title">{ `${name}:` }</div>
              <div className="request-signature__row-value">{ value }</div>
            </div>
          })
        }
      </div>
    </div>
  }

  renderFooter () {
    const {
      signPersonalMessage,
      signTypedMessage,
      cancelPersonalMessage,
      cancelTypedMessage,
      signMessage,
      cancelMessage,
      txData,
      hideModal,
    } = this.props
    const { type } = txData
    let cancel
    let sign
    if (type === 'personal_sign') {
      cancel = cancelPersonalMessage
      sign = signPersonalMessage
    } else if (type === 'eth_signTypedData') {
      cancel = cancelTypedMessage
      sign = signTypedMessage
    } else if (type === 'eth_sign') {
      cancel = cancelMessage
      sign = signMessage
    }

    return <div className="request-signature__footer">
      <Button
        type="default"
        large={true}
        className="request-signature__footer__cancel-button"
        onClick={event => {
          cancel(event)
          hideModal()
        }}
      >
        { this.context.t('cancel') }
      </Button>
      <Button
        type="primary"
        large={true}
        className="request-signature__footer__sign-button"
        onClick={event => {
          console.log('event', event)
          console.log('txData', txData)
          sign(txData)
          hideModal()
        }}
      >
        { this.context.t('confirm') }
      </Button>
    </div>
  }

  render () {
    return <div className="request-signature__container">
      { this.renderHeader() }
      { this.renderBody() }
      { this.renderFooter() }
    </div>
  }
}

