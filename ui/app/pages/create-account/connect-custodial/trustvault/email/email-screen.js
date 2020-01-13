import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../../../components/ui/button'
import TextField from '../../../../../components/ui/text-field'
import { CONNECT_HARDWARE_ROUTE } from '../../../../../helpers/constants/routes'

const ENTER_KEY = 13
export class EmailScreen extends PureComponent {
  state = {
    email: null,
  }

  renderBackButton () {
    return (
      <div className="sw-connect__back" onClick={_ => this.props.history.push(CONNECT_HARDWARE_ROUTE)}>
        <div className="sw-connect__list__back-caret" />
        <div className="sw-connect__list__back-caret__back">{this.context.t('back')}</div>
      </div>
    )
  }

  renderNextButton () {
    return (
      <Button
        className="sw-connect__connect-btn"
        type="primary"
        onClick={_ => this.props.getTrustVaultPinChallenge(this.state.email)}
        disabled={!this.state.email}
      >
        {this.context.t('next')}
      </Button>
    )
  }

  renderEmailInputBox () {
    return (
      <div className="sw-connect__email-field">
        <TextField
          autoFocus
          type="text"
          placeholder="Email address"
          largeLabel
          fullWidth
          onChange={event => this.setState({ email: event.target.value })}
          onKeyDown={event => {
            if (event.keyCode === ENTER_KEY) {
              this.props.getTrustVaultPinChallenge(this.state.email)
            }
          }}
        />
      </div>
    )
  }
  renderTrustVaultInfoBox () {
    return (
      <div className="sw-connect__info-box">
        <img className="sw-connect__info-box__info-icon" src="images/tvInfo.png" />
        <div className="sw-connect__info-box__not-user">{this.context.t('trustVaultNotUser')}</div>
        <div className="sw-connect__info-box__ios">{this.context.t('trustVaultIos')}</div>
        <div className="sw-connect__info-box__get-started">{this.context.t('trustVaultGetStarted')}</div>
        <div
          className="sw-connect__info-box__link"
          onClick={() => {
            global.platform.openWindow({
              url: 'https://trustology.io/get-started/',
            })
          }}
        >
          {this.context.t('here')}
        </div>
      </div>
    )
  }

  renderLearnMoreLink () {
    return (
      <div className="sw-connect__learn-more">
        <span className="sw-connect__learn-more__text">{this.context.t('trustVaultLearnMore')}</span>
        <span
          className="sw-connect__learn-more__link"
          onClick={() => {
            global.platform.openWindow({
              url: 'https://help.trustology.io/en/',
            })
          }}
        >
          {this.context.t('FAQ')}
        </span>
      </div>
    )
  }

  renderUnsupportedBrowser () {
    return (
      <div className="new-account-connect-form.unsupported-browser">
        <div className="hw-connect">
          <h3 className="hw-connect__title">{this.context.t('browserNotSupported')}</h3>
          <p className="hw-connect__msg">{this.context.t('chromeRequiredForHardwareWallets')}</p>
        </div>
        <Button
          type="primary"
          large
          onClick={() => {
            global.platform.openWindow({ url: 'https://google.com/chrome' })
          }}
        >
          {this.context.t('downloadGoogleChrome')}
        </Button>
      </div>
    )
  }

  renderHeader () {
    return (
      <div className="sw-connect__header">
        <h3 className="hw-connect__header__title">{this.context.t('trustVaultWelcome')}</h3>
        <p className="hw-connect__header__msg">{this.context.t('trustVaultEnterEmail')}</p>
      </div>
    )
  }

  renderTrustVaultLogo () {
    return (
      <div className="sw-connect__trustvault-logo">
        <img className="sw-connect__trustvault-logo__img" src="images/trustvault-logo.png" />
      </div>
    )
  }

  renderEmailScreen () {
    return (
      <div className="new-account-connect-form">
        {this.renderBackButton()}
        {this.renderTrustVaultLogo()}
        {this.renderHeader()}
        {this.renderEmailInputBox()}
        {this.renderTrustVaultInfoBox()}
        {this.renderNextButton()}
        {this.renderLearnMoreLink()}
      </div>
    )
  }

  render () {
    if (this.props.browserSupported) {
      return this.renderEmailScreen()
    }
    return this.renderUnsupportedBrowser()
  }
}

EmailScreen.propTypes = {
  browserSupported: PropTypes.bool.isRequired,
  getTrustVaultPinChallenge: PropTypes.func.isRequired,
  history: PropTypes.object,
}

EmailScreen.contextTypes = {
  t: PropTypes.func,
}
