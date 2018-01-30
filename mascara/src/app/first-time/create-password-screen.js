import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { createNewVaultAndKeychain } from '../../../../ui/app/actions'
import LoadingScreen from './loading-screen'
import Breadcrumbs from './breadcrumbs'
import { DEFAULT_ROUTE, IMPORT_ACCOUNT_ROUTE } from '../../../../ui/app/routes'
import EventEmitter from 'events'
import Mascot from '../../../../ui/app/components/mascot'

class CreatePasswordScreen extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    createAccount: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    isInitialized: PropTypes.bool,
    isUnlocked: PropTypes.bool,
  }

  state = {
    password: '',
    confirmPassword: '',
  }

  constructor () {
    super()
    this.animationEventEmitter = new EventEmitter()
  }

  componentWillMount () {
    const { isInitialized, isUnlocked, history } = this.props
    if (isInitialized || isUnlocked) {
      history.push(DEFAULT_ROUTE)
    }
  }

  isValid () {
    const { password, confirmPassword } = this.state

    if (!password || !confirmPassword) {
      return false
    }

    if (password.length < 8) {
      return false
    }

    return password === confirmPassword
  }

  createAccount = () => {
    if (!this.isValid()) {
      return
    }

    const { password } = this.state
    const { createAccount, history } = this.props

    createAccount(password)
      .then(() => history.push(DEFAULT_ROUTE))
  }

  render () {
    const { isLoading } = this.props

    return isLoading
      ? <LoadingScreen loadingMessage="Creating your new account" />
      : (
        <div>
          <h2 className="alpha-warning">Warning This is Experimental software and is a Developer BETA </h2>
          <div className="first-view-main">
            <div className="mascara-info">
              <Mascot
                animationEventEmitter={this.animationEventEmitter}
                width="225"
                height="225"
              />
              <div className="info">
                MetaMask is a secure identity vault for Ethereum.
              </div>
              <div className="info">
                It allows you to hold ether & tokens, and interact with decentralized applications.
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
                  history.push(IMPORT_ACCOUNT_ROUTE)
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

const mapStateToProps = state => {
  const { metamask: { isInitialized, isUnlocked }, appState: { isLoading } } = state

  return {
    isLoading,
    isInitialized,
    isUnlocked,
  }
}

export default connect(
  mapStateToProps,
  dispatch => ({
    createAccount: password => dispatch(createNewVaultAndKeychain(password)),
  })
)(CreatePasswordScreen)
