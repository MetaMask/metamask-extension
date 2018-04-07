import EventEmitter from 'events'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import classnames from 'classnames'
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
    next: PropTypes.func.isRequired,
    isMascara: PropTypes.bool.isRequired,
  }

  state = {
    password: '',
    confirmPassword: '',
  }

  constructor () {
    super()
    this.animationEventEmitter = new EventEmitter()
  }

  isValid () {
    const {password, confirmPassword} = this.state

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

    const {password} = this.state
    const {createAccount, next} = this.props

    createAccount(password)
      .then(next)
  }

  render () {
    const { isLoading, goToImportWithSeedPhrase, isMascara } = this.props

    return isLoading
      ? <LoadingScreen loadingMessage="Creating your new account" />
      : (
        <div className={classnames({ 'first-view-main-wrapper': !isMascara })}>
          <div className={classnames({
            'first-view-main': !isMascara,
            'first-view-main__mascara': isMascara,
          })}>
            {isMascara && <div className="mascara-info first-view-phone-invisible">
              {/* <Mascot
                animationEventEmitter={this.animationEventEmitter}
                width="225"
                height="225"
              /> */}
              <img src="images/icon-512.png" width="255" height="225" />
              <div className="info">
                MetaMask is a secure identity vault for Ethereum.
              </div>
              <div className="info">
                It allows you to hold ether & tokens, and interact with decentralized applications.
              </div>
            </div>}
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
  ({ appState: { isLoading }, metamask: { isMascara } }) => ({ isLoading, isMascara }),
  dispatch => ({
    createAccount: password => dispatch(createNewVaultAndKeychain(password)),
  })
)(CreatePasswordScreen)
