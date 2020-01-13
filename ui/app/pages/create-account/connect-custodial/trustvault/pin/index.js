import React, { PureComponent } from 'react'
import { PinScreen } from './pin-screen'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { showAlert, hideAlert, connectCustodialWallet, submitTrustVaultPinChallenge } from '../../../../../store/actions'

class ConnectTrustVaultPinForm extends PureComponent {
  state = {
    error: null,
    browserSupported: true,
    pinChallenge: this.props.pinChallenge,
  }

  showWalletConnectedAlert () {
    this.props.goToHomePage()
    this.props.showAlert(this.context.t('custodialWalletConnected'))
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
  goToHomePage: PropTypes.func,
  onCancelLogin: PropTypes.func,
  email: PropTypes.string,
}

const mapStateToProps = state => ({
  network: state.metamask.network,
  pinChallenge: state.appState.trustVault.pinChallenge,
})

const mapDispatchToProps = dispatch => ({
  showAlert: msg => dispatch(showAlert(msg)),
  hideAlert: () => dispatch(hideAlert()),
  connectCustodialWallet: (deviceName, auth) => dispatch(connectCustodialWallet(deviceName, auth)),
  submitTrustVaultPinChallenge: (email, firstPin, secondPin, sessionToken) =>
    dispatch(submitTrustVaultPinChallenge(email, firstPin, secondPin, sessionToken)),
})

ConnectTrustVaultPinForm.contextTypes = {
  metricsEvent: PropTypes.func,
}

export default connect(mapStateToProps, mapDispatchToProps)(
  ConnectTrustVaultPinForm
)
