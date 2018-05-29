import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import { createNewVaultAndKeychain } from '../../../../ui/app/actions'
import Breadcrumbs from './breadcrumbs'
import EventEmitter from 'events'
import Mascot from '../../../../ui/app/components/mascot'
import classnames from 'classnames'
import {
  INITIALIZE_UNIQUE_IMAGE_ROUTE,
  INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE,
  INITIALIZE_NOTICE_ROUTE,
} from '../../../../ui/app/routes'

class CreatePasswordScreen extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    createAccount: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    isInitialized: PropTypes.bool,
    isUnlocked: PropTypes.bool,
    isMascara: PropTypes.bool.isRequired,
  }

  state = {
    password: '',
    confirmPassword: '',
  }

  constructor (props) {
    super(props)
    this.animationEventEmitter = new EventEmitter()
  }

  componentWillMount () {
    const { isInitialized, history } = this.props

    if (isInitialized) {
      history.push(INITIALIZE_NOTICE_ROUTE)
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

    this.setState({ isLoading: true })
    createAccount(password)
      .then(() => history.push(INITIALIZE_UNIQUE_IMAGE_ROUTE))
  }

  renderFields () {
    const { isMascara, history } = this.props

    return (
      <div className={classnames({ 'first-view-main-wrapper': !isMascara })}>
        <div className={classnames({
          'first-view-main': !isMascara,
          'first-view-main__mascara': isMascara,
        })}>
          {isMascara && <div className="mascara-info first-view-phone-invisible">
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
                history.push(INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE)
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
                history.push(INITIALIZE_IMPORT_ACCOUNT_ROUTE)
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

  render () {
    const { history, isMascara } = this.props

    return (
      <div className={classnames({ 'first-view-main-wrapper': !isMascara })}>
        <div className={classnames({
          'first-view-main': !isMascara,
          'first-view-main__mascara': isMascara,
        })}>
          {isMascara && <div className="mascara-info first-view-phone-invisible">
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
                history.push(INITIALIZE_IMPORT_WITH_SEED_PHRASE_ROUTE)
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
                history.push(INITIALIZE_IMPORT_ACCOUNT_ROUTE)
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

const mapStateToProps = ({ metamask, appState }) => {
  const { isInitialized, isUnlocked, isMascara, noActiveNotices } = metamask
  const { isLoading } = appState

  return {
    isLoading,
    isInitialized,
    isUnlocked,
    isMascara,
    noActiveNotices,
  }
}

export default compose(
  withRouter,
  connect(
    mapStateToProps,
    dispatch => ({
      createAccount: password => dispatch(createNewVaultAndKeychain(password)),
    })
  )
)(CreatePasswordScreen)
