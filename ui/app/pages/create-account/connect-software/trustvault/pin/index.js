const { PureComponent } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../../../../store/actions')
const PinScreen = require('./pin-screen')

class ConnectTrustVaultPinForm extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      error: null,
      browserSupported: true,
      authenticated: false,
      pinChallenge: this.props.pinChallenge,
    }
  }

  showWalletConnectedAlert () {
    this.props.goToHomePage()
    this.props.showAlert(this.context.t('softwareWalletConnected'))
    // Autohide the alert after 1.5 seconds and redirect to home page
    setTimeout(_ => {
      this.props.hideAlert()
    }, 2500)
  }

  submitTrustVaultPinChallenge = async (firstPin, secondPin) => {
    let errorMessage = null
    const deviceName = 'TrustVault'

    const { auth, pinChallenge, error } = await this.props.submitTrustVaultPinChallenge(firstPin, secondPin)
    if (auth) {
      const accounts = await this.props.connectSoftware(deviceName, auth)
      this.showWalletConnectedAlert()
      return accounts
    }
    if (error) {
      errorMessage = (error && error.message) || this.context.t('trustVaultIncorrectPin')
    }
    this.props.onNewPinChallenge(pinChallenge, errorMessage)
    return { auth, pinChallenge, error: errorMessage }
  }

  renderError () {
    return this.state.error
      ? h(
          'span.error',
          {
            style: {
              margin: '20px 20px 10px',
              display: 'block',
              textAlign: 'center',
            }
          },
          this.state.error,
        )
      : null
  }

  renderContent = () => {
    // TODO: handle if pinChallenge is undefined?
    return h(PinScreen, {
      browserSupported: this.state.browserSupported,
      submitTrustVaultPinChallenge: this.submitTrustVaultPinChallenge,
      pinChallenge: this.state.pinChallenge,
      onCancelLogin: this.props.onCancelLogin,
      email: this.props.email,
    })
  }

  render () {
    return h('div', [this.renderError(), this.renderContent()])
  }
}

ConnectTrustVaultPinForm.propTypes = {
  t: PropTypes.func,
  network: PropTypes.string,
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  history: PropTypes.object.isRequired,
  submitTrustVaultPinChallenge: PropTypes.func,
  connectSoftware: PropTypes.func,
  pinChallenge: PropTypes.object,
  onNewPinChallenge: PropTypes.func,
  onErrors: PropTypes.func,
};

const mapStateToProps = state => ({
  network: state.metamask.network,
  pinChallenge: state.appState.trustVault.pinChallenge,
})

const mapDispatchToProps = dispatch => ({
  showAlert: msg => dispatch(actions.showAlert(msg)),
  hideAlert: () => dispatch(actions.hideAlert()),
  connectSoftware: (deviceName, auth) => dispatch(actions.connectSoftware(deviceName, auth)),
  submitTrustVaultPinChallenge: (email, firstPin, secondPin, sessionToken) =>
    dispatch(actions.submitTrustVaultPinChallenge(email, firstPin, secondPin, sessionToken)),
})

ConnectTrustVaultPinForm.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConnectTrustVaultPinForm)
