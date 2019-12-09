import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Button from '../../../components/ui/button'
import { CONNECT_TRUSTVAULT_ROUTE } from '../../../helpers/constants/routes'
class ConnectScreen extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    connectToHardwareWallet: PropTypes.func.isRequired,
    browserSupported: PropTypes.bool.isRequired,
    history: PropTypes.object,
  }

  state = {
    selectedDevice: null,
  }
  history = this.props.history

  connect = () => {
    if (this.state.selectedDevice === 'trustvault') {
      this.history.push(CONNECT_TRUSTVAULT_ROUTE)
    } else if (this.state.selectedDevice) {
      this.props.connectToHardwareWallet(this.state.selectedDevice)
    }
    return null
  }

  renderConnectToTrustVaultButton () {
    return (
      <button
        className={classnames('sw-connect__btn', {
          'selected': this.state.selectedDevice === 'trustvault',
        })}
        onClick={_ => this.setState({selectedDevice: 'trustvault'})}
      >
        <img
          className="sw-connect__btn__img"
          src="images/trustvaultByTrustology.png"
          alt=""
          width="120px"
          height="30px"
        />
      </button>
    )
  }

  renderConnectToTrezorButton () {
    return (
      <button
        className={classnames('hw-connect__btn', {
          'selected': this.state.selectedDevice === 'trezor',
        })}
        onClick={_ => this.setState({selectedDevice: 'trezor'})}
      >
        <img
          className="hw-connect__btn__img"
          src="images/trezor-logo.svg"
          alt=""
        />
      </button>
    )
  }

  renderConnectToLedgerButton () {
    return (
      <button
        className={classnames('hw-connect__btn', {
          'selected': this.state.selectedDevice === 'ledger',
        })}
        onClick={_ => this.setState({selectedDevice: 'ledger'})}
      >
        <img
          className="hw-connect__btn__img"
          src="images/ledger-logo.svg"
          alt=""
        />
      </button>
    )
  }

  renderButtons () {
    return (
      <div>
        <div className="hw-connect__btn-wrapper">
          {this.renderConnectToLedgerButton()}
          {this.renderConnectToTrezorButton()}
        </div>
        <div className="">
          {this.renderConnectToTrustVaultButton()}
        </div>
        <Button
          type="primary"
          large
          className="hw-connect__connect-btn"
          onClick={this.connect}
          disabled={!this.state.selectedDevice}
        >
          {this.context.t('connect')}
        </Button>
      </div>
    )
  }

  renderUnsupportedBrowser () {
    return (
      <div className="new-account-connect-form unsupported-browser">
        <div className="hw-connect">
          <h3 className="hw-connect__title">{this.context.t('browserNotSupported')}</h3>
          <p className="hw-connect__msg">{this.context.t('chromeRequiredForHardwareWallets')}</p>
        </div>
        <Button
          type="primary"
          large
          onClick={() => global.platform.openWindow({
            url: 'https://google.com/chrome',
          })}
        >
          {this.context.t('downloadGoogleChrome')}
        </Button>
      </div>
    )
  }

  renderHeader () {
    return (
      <div className="hw-connect__header">
        <h3 className="hw-connect__header__title">{this.context.t('hardwareWallets')}</h3>
        <p className="hw-connect__header__msg">{this.context.t('hardwareWalletsMsg')}</p>
      </div>
    )
  }

  getAffiliateLinks () {
    const links = {
      trezor: `<a class='hw-connect__get-hw__link' href='https://shop.trezor.io/?a=metamask' target='_blank'>Trezor</a>`,
      ledger: `<a class='hw-connect__get-hw__link' href='https://www.ledger.com/products/ledger-nano-s?r=17c4991a03fa&tracker=MY_TRACKER' target='_blank'>Ledger</a>`,
      trustvault: `<a class='sw-connect__get-sw__link' href='https://trustology.io/get-started/'>here</a>`,
    }

    const text = this.context.t('orderOneHere')
    const response = text.replace('Trezor', links.trezor).replace('Ledger', links.ledger)
    const trustVaultText = this.context.t('orderTrustVaultHere')
    const trustVaultResponse = trustVaultText.replace('here', links.trustvault)

    return (
      <div>
        <div
          className="hw-connect__get-hw__msg"
          dangerouslySetInnerHTML={{__html: response }}
        />
        <div
          className="sw-connect__get-sw__msg"
          dangerouslySetInnerHTML={{__html: trustVaultResponse }}
        />
      </div>
    )
  }

  renderTrezorAffiliateLink () {
    return (
      <div className="hw-connect__get-hw">
        <p className="hw-connect__get-hw__msg">{this.context.t('dontHaveAHardwareWallet')}</p>
        {this.getAffiliateLinks()}
      </div>
    )
  }


  scrollToTutorial = () => {
    if (this.referenceNode) {
      this.referenceNode.scrollIntoView({behavior: 'smooth'})
    }
  }

  renderLearnMore () {
    if (this.state.selectedDevice) {
      return (
        <p className="hw-connect__learn-more" onClick={this.scrollToTutorial}>
          {this.context.t('learnMore')}
          <img className="hw-connect__learn-more__arrow" src="images/caret-right.svg" alt="" />
        </p>
      )
    }
  }
  renderTrustVaultTutorialSteps () {
    const steps = [
      {
        asset: 'tv-wallet-step-1',
        dimensions: {width: '337.5', height: '154px'},
        title: this.context.t('step1SoftwareWallet'),
        message: this.context.t('step1SoftwareWalletMsg'),
      },
      {
        asset: 'tv-wallet-step-2',
        dimensions: {width: '300px', height: '130px'},
        title: this.context.t('step2SoftwareWallet'),
        message: this.context.t('step2SoftwareWalletMsg'),
      },
      {
        asset: 'tv-wallet-step-3',
        dimensions: {width: '240px', height: '156px'},
        title: this.context.t('step3SoftwareWallet'),
        message: this.context.t('step3SoftwareWalletMsg'),
      },
    ]
    return (
      <div
        className="sw-tutorial"
        ref={node => {
          this.referenceNode = node
        }}
      >
        {steps.map((step, index) => (
          <div className="sw-connect" key={index}>
            <h3 className="sw-connect__title">{step.title}</h3>
            <p className="sw-connect__msg">{step.message}</p>
            <img className="sw-connect__step-asset" src={`images/${step.asset}.png`} {...step.dimensions} alt="" />
          </div>
        ))}
      </div>
    )
  }

  renderHardwareTutorialSteps () {
    const steps = [
      {
        asset: 'hardware-wallet-step-1',
        dimensions: {width: '225px', height: '75px'},
        title: this.context.t('step1HardwareWallet'),
        message: this.context.t('step1HardwareWalletMsg'),
      },
      {
        asset: 'hardware-wallet-step-2',
        dimensions: {width: '300px', height: '100px'},
        title: this.context.t('step2HardwareWallet'),
        message: this.context.t('step2HardwareWalletMsg'),
      },
      {
        asset: 'hardware-wallet-step-3',
        dimensions: {width: '120px', height: '90px'},
        title: this.context.t('step3HardwareWallet'),
        message: this.context.t('step3HardwareWalletMsg'),
      },
    ]
    return (
      <div
        className="hw-tutorial"
        ref={node => {
          this.referenceNode = node
        }}
      >
        {steps.map((step, index) => (
          <div className="hw-connect" key={index}>
            <h3 className="hw-connect__title">{step.title}</h3>
            <p className="hw-connect__msg">{step.message}</p>
            <img className="hw-connect__step-asset" src={`images/${step.asset}.svg`} {...step.dimensions} alt="" />
          </div>
        ))}
      </div>
    )
  }


  renderTutorialSteps () {
    if (this.state.selectedDevice === 'trezor' || this.state.selectedDevice === 'ledger') {
      return this.renderHardwareTutorialSteps()
    } else if (this.state.selectedDevice === 'trustvault') {
      return this.renderTrustVaultTutorialSteps()
    }
  }

  renderFooter () {
    if (this.state.selectedDevice) {
      return (
        <div className="hw-connect__footer">
          <h3 className="hw-connect__footer__title">{this.context.t('readyToConnect')}</h3>
          {this.renderButtons()}
          <p className="hw-connect__footer__msg">
            {this.context.t('havingTroubleConnecting')}
            <a className="hw-connect__footer__link" href="https://support.metamask.io/" target="_blank" rel="noopener noreferrer">
              {this.context.t('getHelp')}
            </a>
          </p>
        </div>
      )
    }
  }

  renderConnectScreen () {
    return (
      <div className="new-account-connect-form">
        {this.renderHeader()}
        {this.renderButtons()}
        {this.renderTrezorAffiliateLink()}
        {this.renderLearnMore()}
        {this.renderTutorialSteps()}
        {this.renderFooter()}
      </div>
    )
  }

  render () {
    if (this.props.browserSupported) {
      return this.renderConnectScreen()
    }
    return this.renderUnsupportedBrowser()
  }
}

module.exports = ConnectScreen

