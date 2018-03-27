import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import classnames from 'classnames'
import {
  createNewVaultAndRestore,
  hideWarning,
  displayWarning,
  unMarkPasswordForgotten,
} from '../../../../ui/app/actions'

class ImportSeedPhraseScreen extends Component {
  static propTypes = {
    warning: PropTypes.string,
    back: PropTypes.func.isRequired,
    next: PropTypes.func.isRequired,
    createNewVaultAndRestore: PropTypes.func.isRequired,
    hideWarning: PropTypes.func.isRequired,
    displayWarning: PropTypes.func,
    leaveImportSeedScreenState: PropTypes.func,
  };

  state = {
    seedPhrase: '',
    password: '',
    confirmPassword: '',
  }

  parseSeedPhrase = (seedPhrase) => {
    return seedPhrase
      .match(/\w+/g)
      .join(' ')
  }

  onChange = ({ seedPhrase, password, confirmPassword }) => {
    const {
      password: prevPassword,
      confirmPassword: prevConfirmPassword,
    } = this.state
    const { displayWarning, hideWarning } = this.props

    let warning = null

    if (seedPhrase && this.parseSeedPhrase(seedPhrase).split(' ').length !== 12) {
      warning = 'Seed Phrases are 12 words long'
    } else if (password && password.length < 8) {
      warning = 'Passwords require a mimimum length of 8'
    } else if ((password || prevPassword) !== (confirmPassword || prevConfirmPassword)) {
      warning = 'Confirmed password does not match'
    }

    if (warning) {
      displayWarning(warning)
    } else {
      hideWarning()
    }

    seedPhrase && this.setState({ seedPhrase })
    password && this.setState({ password })
    confirmPassword && this.setState({ confirmPassword })
  }

  onClick = () => {
    const { password, seedPhrase } = this.state
    const {
      createNewVaultAndRestore,
      next,
      displayWarning,
      leaveImportSeedScreenState,
    } = this.props

    leaveImportSeedScreenState()
    createNewVaultAndRestore(password, this.parseSeedPhrase(seedPhrase))
      .then(next)
  }

  render () {
    const { seedPhrase, password, confirmPassword } = this.state
    const { warning } = this.props
    const importDisabled = warning || !seedPhrase || !password || !confirmPassword
    return (
      <div className="first-view-main-wrapper">
        <div className="first-view-main">
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
            <div className="import-account__input-wrapper">
              <label className="import-account__input-label">Wallet Seed</label>
              <textarea
                className="import-account__secret-phrase"
                onChange={e => this.onChange({seedPhrase: e.target.value})}
                value={this.state.seedPhrase}
                placeholder="Separate each word with a single space"
              />
            </div>
            <span
              className="error"
            >
              {this.props.warning}
            </span>
            <div className="import-account__input-wrapper">
              <label className="import-account__input-label">New Password</label>
              <input
                className="first-time-flow__input"
                type="password"
                placeholder="New Password (min 8 characters)"
                onChange={e => this.onChange({password: e.target.value})}
              />
            </div>
            <div className="import-account__input-wrapper">
              <label
                className={classnames('import-account__input-label', {
                  'import-account__input-label__disabled': password.length < 8,
                })}
              >Confirm Password</label>
              <input
                className={classnames('first-time-flow__input', {
                  'first-time-flow__input__disabled': password.length < 8,
                })}
                type="password"
                placeholder="Confirm Password"
                onChange={e => this.onChange({confirmPassword: e.target.value})}
                disabled={password.length < 8}
              />
            </div>
            <button
              className="first-time-flow__button"
              onClick={() => !importDisabled && this.onClick()}
              disabled={importDisabled}
            >
              Import
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(
  ({ appState: { warning } }) => ({ warning }),
  dispatch => ({
    leaveImportSeedScreenState: () => {
      dispatch(unMarkPasswordForgotten())
    },
    createNewVaultAndRestore: (pw, seed) => dispatch(createNewVaultAndRestore(pw, seed)),
    displayWarning: (warning) => dispatch(displayWarning(warning)),
    hideWarning: () => dispatch(hideWarning()),
  })
)(ImportSeedPhraseScreen)
