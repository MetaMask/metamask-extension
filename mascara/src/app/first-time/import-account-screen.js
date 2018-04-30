import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import classnames from 'classnames'
import LoadingScreen from './loading-screen'
import {importNewAccount, hideWarning} from '../../../../ui/app/actions'

const Input = ({ label, placeholder, onChange, errorMessage, type = 'text' }) => (
  <div className="import-account__input-wrapper">
    <div className="import-account__input-label">{label}</div>
    <input
      type={type}
      placeholder={placeholder}
      className={classnames('first-time-flow__input import-account__input', {
        'first-time-flow__input--error': errorMessage,
      })}
      onChange={onChange}
    />
    <div className="import-account__input-error-message">{errorMessage}</div>
  </div>
)

Input.prototype.propTypes = {
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  errorMessage: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

class ImportAccountScreen extends Component {
  static OPTIONS = {
    PRIVATE_KEY: 'private_key',
    JSON_FILE: 'json_file',
  };

  static propTypes = {
    warning: PropTypes.string,
    back: PropTypes.func.isRequired,
    next: PropTypes.func.isRequired,
    importNewAccount: PropTypes.func.isRequired,
    hideWarning: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
  };

  state = {
    selectedOption: ImportAccountScreen.OPTIONS.PRIVATE_KEY,
    privateKey: '',
    jsonFile: {},
  }

  isValid () {
    const { OPTIONS } = ImportAccountScreen
    const { privateKey, jsonFile, password } = this.state

    switch (this.state.selectedOption) {
      case OPTIONS.JSON_FILE:
        return Boolean(jsonFile && password)
      case OPTIONS.PRIVATE_KEY:
      default:
        return Boolean(privateKey)
    }
  }

  onClick = () => {
    const { OPTIONS } = ImportAccountScreen
    const { importNewAccount, next } = this.props
    const { privateKey, jsonFile, password } = this.state

    switch (this.state.selectedOption) {
      case OPTIONS.JSON_FILE:
        return importNewAccount('JSON File', [ jsonFile, password ])
          // JS runtime requires caught rejections but failures are handled by Redux
          .catch()
          .then(next)
      case OPTIONS.PRIVATE_KEY:
      default:
        return importNewAccount('Private Key', [ privateKey ])
          // JS runtime requires caught rejections but failures are handled by Redux
          .catch()
          .then(next)
    }
  }

  renderPrivateKey () {
    return Input({
      label: 'Add Private Key String',
      placeholder: 'Enter private key',
      onChange: e => this.setState({ privateKey: e.target.value }),
      errorMessage: this.props.warning && 'Something went wrong. Please make sure your private key is correct.',
    })
  }

  renderJsonFile () {
    const { jsonFile: { name } } = this.state
    const { warning } = this.props

    return (
      <div className="">
        <div className="import-account__input-wrapper">
          <div className="import-account__input-label">Upload File</div>
          <div className="import-account__file-picker-wrapper">
            <input
              type="file"
              id="file"
              className="import-account__file-input"
              onChange={e => this.setState({ jsonFile: e.target.files[0] })}
            />
            <label
              htmlFor="file"
              className={classnames('import-account__file-input-label', {
                'import-account__file-input-label--error': warning,
              })}
            >
              Choose File
            </label>
            <div className="import-account__file-name">{name}</div>
          </div>
          <div className="import-account__input-error-message">
            {warning && 'Something went wrong. Please make sure your JSON file is properly formatted.'}
          </div>
        </div>
        {Input({
          label: 'Enter Password',
          placeholder: 'Enter Password',
          type: 'password',
          onChange: e => this.setState({ password: e.target.value }),
          errorMessage: warning && 'Please make sure your password is correct.',
        })}
      </div>
    )
  }

  renderContent () {
    const { OPTIONS } = ImportAccountScreen

    switch (this.state.selectedOption) {
      case OPTIONS.JSON_FILE:
        return this.renderJsonFile()
      case OPTIONS.PRIVATE_KEY:
      default:
        return this.renderPrivateKey()
    }
  }

  render () {
    const { OPTIONS } = ImportAccountScreen
    const { selectedOption } = this.state

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
            Import an Account
          </div>
          <div className="import-account__selector-label">
            How would you like to import your account?
          </div>
          <select
            className="import-account__dropdown"
            value={selectedOption}
            onChange={e => {
              this.setState({ selectedOption: e.target.value })
              this.props.hideWarning()
            }}
          >
            <option value={OPTIONS.PRIVATE_KEY}>Private Key</option>
            <option value={OPTIONS.JSON_FILE}>JSON File</option>
          </select>
          {this.renderContent()}
          <button
            className="first-time-flow__button"
            disabled={!this.isValid()}
            onClick={this.onClick}
          >
            Import
          </button>
          <a
            href="https://github.com/MetaMask/faq/blob/master/README.md#q-i-cant-use-the-import-feature-for-uploading-a-json-file-the-window-keeps-closing-when-i-try-to-select-a-file"
            className="first-time-flow__link import-account__faq-link"
            rel="noopener noreferrer"
            target="_blank"
          >
            File import not working?
          </a>
        </div>
      )
  }
}

export default connect(
  ({ appState: { isLoading, warning } }) => ({ isLoading, warning }),
  dispatch => ({
    importNewAccount: (strategy, args) => dispatch(importNewAccount(strategy, args)),
    hideWarning: () => dispatch(hideWarning()),
  })
)(ImportAccountScreen)
