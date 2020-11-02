import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { getNetworkDisplayName } from '../../../../../../app/scripts/controllers/network/util'
import Button from '../../../ui/button'

export default class DepositEtherModal extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func.isRequired,
  }

  static propTypes = {
    network: PropTypes.string.isRequired,
    toWyre: PropTypes.func.isRequired,
    toCoinSwitch: PropTypes.func.isRequired,
    address: PropTypes.string.isRequired,
    toFaucet: PropTypes.func.isRequired,
    hideWarning: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    showAccountDetailModal: PropTypes.func.isRequired,
  }

  faucetRowText = (networkName) => {
    return this.context.t('getEtherFromFaucet', [networkName])
  }

  goToAccountDetailsModal = () => {
    this.props.hideWarning()
    this.props.hideModal()
    this.props.showAccountDetailModal()
  }

  renderRow({
    logo,
    title,
    text,
    buttonLabel,
    onButtonClick,
    hide,
    className,
    hideButton,
    hideTitle,
    onBackClick,
    showBackButton,
  }) {
    if (hide) {
      return null
    }

    return (
      <div className={className || 'deposit-ether-modal__buy-row'}>
        {onBackClick && showBackButton && (
          <div
            className="deposit-ether-modal__buy-row__back"
            onClick={onBackClick}
          >
            <i className="fa fa-arrow-left cursor-pointer" />
          </div>
        )}
        <div className="deposit-ether-modal__buy-row__logo-container">
          {logo}
        </div>
        <div className="deposit-ether-modal__buy-row__description">
          {!hideTitle && (
            <div className="deposit-ether-modal__buy-row__description__title">
              {title}
            </div>
          )}
          <div className="deposit-ether-modal__buy-row__description__text">
            {text}
          </div>
        </div>
        {!hideButton && (
          <div className="deposit-ether-modal__buy-row__button">
            <Button
              type="secondary"
              className="deposit-ether-modal__deposit-button"
              large
              onClick={onButtonClick}
            >
              {buttonLabel}
            </Button>
          </div>
        )}
      </div>
    )
  }

  render() {
    const { network, toWyre, toCoinSwitch, address, toFaucet } = this.props

    const isTestNetwork = ['3', '4', '5', '42'].find((n) => n === network)
    const networkName = getNetworkDisplayName(network)

    return (
      <div className="page-container page-container--full-width page-container--full-height">
        <div className="page-container__header">
          <div className="page-container__title">
            {this.context.t('depositEther')}
          </div>
          <div className="page-container__subtitle">
            {this.context.t('needEtherInWallet')}
          </div>
          <div
            className="page-container__header-close"
            onClick={() => {
              this.props.hideWarning()
              this.props.hideModal()
            }}
          />
        </div>
        <div className="page-container__content">
          <div className="deposit-ether-modal__buy-rows">
            {this.renderRow({
              logo: (
                <img
                  alt=""
                  className="deposit-ether-modal__logo"
                  src="./images/deposit-eth.svg"
                  style={{
                    height: '75px',
                    width: '75px',
                  }}
                />
              ),
              title: this.context.t('directDepositEther'),
              text: this.context.t('directDepositEtherExplainer'),
              buttonLabel: this.context.t('viewAccount'),
              onButtonClick: () => this.goToAccountDetailsModal(),
            })}
            {this.renderRow({
              logo: <i className="fa fa-tint fa-2x" />,
              title: this.context.t('testFaucet'),
              text: this.faucetRowText(networkName),
              buttonLabel: this.context.t('getEther'),
              onButtonClick: () => toFaucet(network),
              hide: !isTestNetwork,
            })}
            {this.renderRow({
              logo: (
                <div
                  className="deposit-ether-modal__logo"
                  style={{
                    backgroundImage: "url('./images/wyre.svg')",
                    height: '40px',
                  }}
                />
              ),
              title: this.context.t('buyWithWyre'),
              text: this.context.t('buyWithWyreDescription'),
              buttonLabel: this.context.t('continueToWyre'),
              onButtonClick: () => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Accounts',
                    action: 'Deposit Ether',
                    name: 'Click buy Ether via Wyre',
                  },
                })
                toWyre(address)
              },
              hide: isTestNetwork,
            })}
            {this.renderRow({
              logo: (
                <div
                  className="deposit-ether-modal__logo"
                  style={{
                    backgroundImage: "url('./images/coinswitch_logo.png')",
                    height: '40px',
                  }}
                />
              ),
              title: this.context.t('buyCoinSwitch'),
              text: this.context.t('buyCoinSwitchExplainer'),
              buttonLabel: this.context.t('continueToCoinSwitch'),
              onButtonClick: () => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Accounts',
                    action: 'Deposit Ether',
                    name: 'Click buy Ether via CoinSwitch',
                  },
                })
                toCoinSwitch(address)
              },
              hide: isTestNetwork,
            })}
          </div>
        </div>
      </div>
    )
  }
}
