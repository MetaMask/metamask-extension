const { PureComponent } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { connect } = require('react-redux')
const actions = require('../../../../../store/actions')
const PinScreen = require('./pin-screen')

class ConnectTrustVaultPinForm extends PureComponent {
  static propTypes = {
    goToHomePage: PropTypes.func,
    onCancelLogin: PropTypes.func,
    email: PropTypes.string,
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
    this.props.showAlert(this.context.t('softwareWalletConnected'))
    // Autohide the alert after 1.5 seconds and redirect to home page
    setTimeout(_ => {
      this.props.hideAlert()
    }, 2500)
  }

  submitTrustVaultPinChallenge = async (firstPin, secondPin) => {
    const deviceName = 'TrustVault'
    try {
      const auth = await this.props.submitTrustVaultPinChallenge(firstPin, secondPin)
      const accounts = await this.props.connectSoftware(deviceName, auth)
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
    return this.state.error
      ? h(
        'span.sw-connect__error',
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
  showAlert: PropTypes.func,
  hideAlert: PropTypes.func,
  submitTrustVaultPinChallenge: PropTypes.func,
  connectSoftware: PropTypes.func,
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
  connectSoftware: (deviceName, auth) => dispatch(actions.connectSoftware(deviceName, auth)),
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
