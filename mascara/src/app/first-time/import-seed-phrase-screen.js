import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import LoadingScreen from './loading-screen'
import {createNewVaultAndRestore, hideWarning} from '../../../../ui/app/actions'

class ImportSeedPhraseScreen extends Component {
  static propTypes = {
    warning: PropTypes.string,
    back: PropTypes.func.isRequired,
    next: PropTypes.func.isRequired,
    createNewVaultAndRestore: PropTypes.func.isRequired,
    hideWarning: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
  };

  state = {
    seedPhrase: '',
    password: '',
    confirmPassword: '',
  }

  onClick = () => {
    const { password, seedPhrase } = this.state
    const { createNewVaultAndRestore, next } = this.props

    createNewVaultAndRestore(password, seedPhrase)
      .then(next)
  }

  isValid () {
    const { seedPhrase, password, confirmPassword } = this.state

    if (seedPhrase.split(' ').length !== 12) {
      return false
    }

    if (password.length < 8) {
      return false
    }

    if (password !== confirmPassword) {
      return false
    }

    return true
  }

  render () {
    return this.props.isLoading
      ? <LoadingScreen loadingMessage="Creating your new account" />
      : (
        <div className="import-account">
          <a
            className="import-account__back-button"
            onClick={e => {
              e.preventDefault()
              this.props.back()
            }}
            href="#"
          >
            {`< Back`}
          </a>
          <div className="import-account__title">
            Import an Account with Seed Phrase
          </div>
          <div className="import-account__selector-label">
            Enter your secret twelve word phrase here to restore your vault.
          </div>
          <textarea
            className="import-account__secret-phrase"
            onChange={e => this.setState({seedPhrase: e.target.value})}
          />
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
            onClick={this.onClick}
            disabled={!this.isValid()}
          >
            Import
          </button>
        </div>
      )
  }
}

export default connect(
  ({ appState: { isLoading, warning } }) => ({ isLoading, warning }),
  dispatch => ({
    createNewVaultAndRestore: (pw, seed) => dispatch(createNewVaultAndRestore(pw, seed)),
    hideWarning: () => dispatch(hideWarning()),
  })
)(ImportSeedPhraseScreen)
