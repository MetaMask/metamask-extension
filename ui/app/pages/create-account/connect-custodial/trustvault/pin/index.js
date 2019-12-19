import React, { PureComponent } from 'react'
const PropTypes = require('prop-types')
const { connect } = require('react-redux')
const actions = require('../../../../../store/actions')
const PinScreen = require('./pin-screen')

class ConnectTrustVaultPinForm extends PureComponent {
  static propTypes = {
    goToHomePage: PropTypes.func,
    onCancelLogin: PropTypes.func,
    email: PropTypes.string,
    showAlert: PropTypes.func,
  }
  constructor (props) {
    super(props)
    this.state = {
      error: null,
      browserSupported: true,
      pinChallenge: this.props.pinChallenge,
    }
  }

  showWalletConnectedAlert () {
    this.props.goToHomePage()
    this.props.showAlert('Custodial wallet successfully connected')
    // Autohide the alert after 1.5 seconds and redirect to home page
    setTimeout(_ => {
      this.props.hideAlert()
    }, 2500)
  }

  submitTrustVaultPinChallenge = async (firstPin, secondPin) => {
    const deviceName = 'TrustVault'
    try {
      const auth = await this.props.submitTrustVaultPinChallenge(firstPin, secondPin)
      const accounts = await this.props.connectCustodialWallet(deviceName, auth)
      this.showWalletConnectedAlert()
      return accounts
    } catch (err) {
      const { message, data } = err
      const errorMessage = message || this.context.t('trustVaultIncorrectPin')
      this.props.onNewPinChallenge(data && data.pinChallenge, errorMessage)
      throw err
    }
  }

  renderError () {
    return this.state.error ?
      (
        <span className="sw-connect__error" >
          {this.state.error}
        </span>
      ) : null
  }

  renderContent = () => {
    return (
      <PinScreen
        browserSupported={this.state.browserSupported}
        submitTrustVaultPinChallenge={this.submitTrustVaultPinChallenge}
        pinChallenge={this.state.pinChallenge}
        onCancelLogin={this.props.onCancelLogin}
        email={this.props.email}
      >
      </PinScreen>
    )
  }

  render () {
    return (
      <div>
        {this.renderError()}
        {this.renderContent()}
      </div>
    )
  }
}

ConnectTrustVaultPinForm.propTypes = {
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  submitTrustVaultPinChallenge: PropTypes.func,
  connectCustodialWallet: PropTypes.func,
  pinChallenge: PropTypes.object,
  onNewPinChallenge: PropTypes.func,
}

const mapStateToProps = state => ({
  network: state.metamask.network,
  pinChallenge: state.appState.trustVault.pinChallenge,
})

const mapDispatchToProps = dispatch => ({
  showAlert: msg => dispatch(actions.showAlert(msg)),
  hideAlert: () => dispatch(actions.hideAlert()),
  connectCustodialWallet: (deviceName, auth) => dispatch(actions.connectCustodialWallet(deviceName, auth)),
  submitTrustVaultPinChallenge: (email, firstPin, secondPin, sessionToken) =>
    dispatch(actions.submitTrustVaultPinChallenge(email, firstPin, secondPin, sessionToken)),
})

ConnectTrustVaultPinForm.contextTypes = {
  metricsEvent: PropTypes.func,
}

module.exports = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConnectTrustVaultPinForm)
