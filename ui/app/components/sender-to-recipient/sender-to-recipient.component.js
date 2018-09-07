import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../identicon'
import Tooltip from '../tooltip-v2'
import copyToClipboard from 'copy-to-clipboard'
import { DEFAULT_VARIANT, CARDS_VARIANT } from './sender-to-recipient.constants'

const variantHash = {
  [DEFAULT_VARIANT]: 'sender-to-recipient--default',
  [CARDS_VARIANT]: 'sender-to-recipient--cards',
}

export default class SenderToRecipient extends PureComponent {
  static propTypes = {
    senderName: PropTypes.string,
    senderAddress: PropTypes.string,
    recipientName: PropTypes.string,
    recipientAddress: PropTypes.string,
    t: PropTypes.func,
    variant: PropTypes.oneOf([DEFAULT_VARIANT, CARDS_VARIANT]),
    addressOnly: PropTypes.bool,
    assetImage: PropTypes.string,
  }

  static defaultProps = {
    variant: DEFAULT_VARIANT,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    senderAddressCopied: false,
    recipientAddressCopied: false,
  }

  renderSenderIdenticon () {
    return !this.props.addressOnly && (
      <div className="sender-to-recipient__sender-icon">
        <Identicon
          address={this.props.senderAddress}
          diameter={24}
        />
      </div>
    )
  }

  renderSenderAddress () {
    const { t } = this.context
    const { senderName, senderAddress, addressOnly } = this.props

    return (
      <Tooltip
        position="bottom"
        title={this.state.senderAddressCopied ? t('copiedExclamation') : t('copyAddress')}
        wrapperClassName="sender-to-recipient__tooltip-wrapper"
        containerClassName="sender-to-recipient__tooltip-container"
        onHidden={() => this.setState({ senderAddressCopied: false })}
      >
      <div className="sender-to-recipient__name">
        { addressOnly ? `${t('from')}: ${senderAddress}` : senderName }
      </div>
    </Tooltip>
    )
  }

  renderRecipientIdenticon () {
    const { recipientAddress, assetImage } = this.props

    return !this.props.addressOnly && (
      <div className="sender-to-recipient__sender-icon">
        <Identicon
          address={recipientAddress}
          diameter={24}
          image={assetImage}
        />
      </div>
    )
  }

  renderRecipientWithAddress () {
    const { t } = this.context
    const { recipientName, recipientAddress, addressOnly } = this.props

    return (
      <div
        className="sender-to-recipient__party sender-to-recipient__party--recipient sender-to-recipient__party--recipient-with-address"
        onClick={() => {
          this.setState({ recipientAddressCopied: true })
          copyToClipboard(recipientAddress)
        }}
      >
        { this.renderRecipientIdenticon() }
        <Tooltip
          position="bottom"
          title={this.state.recipientAddressCopied ? t('copiedExclamation') : t('copyAddress')}
          wrapperClassName="sender-to-recipient__tooltip-wrapper"
          containerClassName="sender-to-recipient__tooltip-container"
          onHidden={() => this.setState({ recipientAddressCopied: false })}
        >
          <div className="sender-to-recipient__name">
            {
              addressOnly
                ? `${t('to')}: ${recipientAddress}`
                : (recipientName || this.context.t('newContract'))
            }
          </div>
        </Tooltip>
      </div>
    )
  }

  renderRecipientWithoutAddress () {
    return (
      <div className="sender-to-recipient__party sender-to-recipient__party--recipient">
        { !this.props.addressOnly && <i className="fa fa-file-text-o" /> }
        <div className="sender-to-recipient__name">
          { this.context.t('newContract') }
        </div>
      </div>
    )
  }

  renderArrow () {
    return this.props.variant === CARDS_VARIANT
      ? (
        <div className="sender-to-recipient__arrow-container">
          <img
            height={20}
            src="./images/caret-right.svg"
          />
        </div>
      ) : (
        <div className="sender-to-recipient__arrow-container">
          <div className="sender-to-recipient__arrow-circle">
            <img
              height={15}
              width={15}
              src="./images/arrow-right.svg"
            />
          </div>
        </div>
      )
  }

  render () {
    const { senderAddress, recipientAddress, variant } = this.props

    return (
      <div className={classnames(variantHash[variant])}>
        <div
          className={classnames('sender-to-recipient__party sender-to-recipient__party--sender')}
          onClick={() => {
            this.setState({ senderAddressCopied: true })
            copyToClipboard(senderAddress)
          }}
        >
          { this.renderSenderIdenticon() }
          { this.renderSenderAddress() }
        </div>
        { this.renderArrow() }
        {
          recipientAddress
            ? this.renderRecipientWithAddress()
            : this.renderRecipientWithoutAddress()
        }
      </div>
    )
  }
}
