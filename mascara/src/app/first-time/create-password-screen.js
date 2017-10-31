import EventEmitter from 'events'
import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux';
import {createNewVaultAndKeychain} from '../../../../ui/app/actions'
import LoadingScreen from './loading-screen'
import Breadcrumbs from './breadcrumbs'
import Mascot from '../../../../ui/app/components/mascot'

class CreatePasswordScreen extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    createAccount: PropTypes.func.isRequired,
    goToImportWithSeedPhrase: PropTypes.func.isRequired,
    goToImportAccount: PropTypes.func.isRequired,
    next: PropTypes.func.isRequired
  }

  state = {
    password: '',
    confirmPassword: ''
  }

  constructor () {
    super()
    this.animationEventEmitter = new EventEmitter()
  }

  isValid() {
    const {password, confirmPassword} = this.state;

    if (!password || !confirmPassword) {
      return false;
    }

    if (password.length < 8) {
      return false;
    }

    return password === confirmPassword;
  }

  createAccount = () => {
    if (!this.isValid()) {
      return;
    }

    const {password} = this.state;
    const {createAccount, next} = this.props;

    createAccount(password)
      .then(next);
  }

  render() {
    const { isLoading, goToImportAccount, goToImportWithSeedPhrase } = this.props

    return isLoading
      ? <LoadingScreen loadingMessage="Creating your new account" />
      : (
        <div>
          <h2 className="alpha-warning">Warning This is Experemental software and is a Developer Alapha</h2>
          <div className="first-view-main">
            <div className="mascara-info">
              <Mascot
                animationEventEmitter={this.animationEventEmitter}
                width="225"
                height="225"
              />
              <div className="info">
                MetaMask is a bridge that allows you to visit the distributed web
                of tomorrow in your browser today. It allows you to run Ethereum Apps right in
                your browser without running a full Ethereum node but still gives
                you the option to if you want to bring your own.

                MetaMask includes a secure identity vault stored locally on your machine,
                providing a user interface to manage your identities on different sites
                and sign blockchain transactions
              </div>
            </div>
            <div className="create-password">
              <div className="create-password__title">
                Create Password
              </div>
              <input
                className="first-time-flow__input"
                type="password"
                placeholder="New Password (min 8 characters)"
                onChange={e => this.setState({password: e.target.value})}
              />
              <input
                className="first-time-flow__input create-password__confirm-input"
                type="password"
                placeholder="Confirm Password"
                onChange={e => this.setState({confirmPassword: e.target.value})}
              />
              <button
                className="first-time-flow__button"
                disabled={!this.isValid()}
                onClick={this.createAccount}
              >
                Create
              </button>
              <a
                href=""
                className="first-time-flow__link create-password__import-link"
                onClick={e => {
                  e.preventDefault()
                  goToImportWithSeedPhrase()
                }}
              >
                Import with seed phrase
              </a>
              { /* }
              <a
                href=""
                className="first-time-flow__link create-password__import-link"
                onClick={e => {
                  e.preventDefault()
                  goToImportAccount()
                }}
              >
                Import an account
              </a>
              { */ }
              <Breadcrumbs total={3} currentIndex={0} />
            </div>
          </div>
        </div>
      )
  }
}

export default connect(
  ({ appState: { isLoading } }) => ({ isLoading }),
  dispatch => ({
    createAccount: password => dispatch(createNewVaultAndKeychain(password)),
  })
)(CreatePasswordScreen)
