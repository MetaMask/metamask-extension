import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux';
import {createNewVaultAndKeychain} from '../../../../ui/app/actions'
import LoadingScreen from './loading-screen'
import Breadcrumbs from './breadcrumbs'

class CreatePasswordScreen extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    createAccount: PropTypes.func.isRequired,
    goToImportAccount: PropTypes.func.isRequired,
    next: PropTypes.func.isRequired
  }

  state = {
    password: '',
    confirmPassword: ''
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
    const { isLoading, goToImportAccount } = this.props

    return isLoading
      ? <LoadingScreen loadingMessage="Creating your new account" />
      : (
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
              goToImportAccount()
            }}
          >
            Import an account
          </a>
          <Breadcrumbs total={3} currentIndex={0} />
        </div>
      )
  }
}

export default connect(
  ({ appState: { isLoading } }) => ({ isLoading }),
  dispatch => ({
    createAccount: password => dispatch(createNewVaultAndKeychain(password))
  })
)(CreatePasswordScreen)
