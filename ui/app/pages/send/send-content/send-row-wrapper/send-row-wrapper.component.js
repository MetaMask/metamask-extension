import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowErrorMessage from './send-row-error-message'
import SendRowWarningMessage from './send-row-warning-message'

export default class SendRowWrapper extends Component {

  static propTypes = {
    children: PropTypes.node,
    errorType: PropTypes.string,
    label: PropTypes.string,
    maxModeOn: PropTypes.bool,
    showError: PropTypes.bool,
    showWarning: PropTypes.bool,
    warningType: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const {
      children,
      errorType = '',
      label,
      showError = false,
      showWarning = false,
      warningType = '',
      maxModeOn,
    } = this.props
    const formField = Array.isArray(children) ? children[1] || children[0] : children
    const customLabelContent = children.length > 1 ? children[0] : null

    return (
      errorType === 'amount'
      ?
      <div className="send-v2__form-row">
        <div className="send-v2__form-label">
          {label}
          {customLabelContent}
        </div>
        <div className="send-v2__form-field-container">
          <div className="send-v2__form-field">
            {formField}
          </div>
          <div className="send-v2__error-message">
            {showError && <SendRowErrorMessage errorType={errorType} />}
            {!showError && showWarning && <SendRowWarningMessage warningType={warningType} />}
            {!showError && !showWarning && maxModeOn
            ?
            <div className="send-v2__max-mode-message">
              {'Max Set'}
            </div>
            :
            null}
          </div>
        </div>
      </div>
      :
      <div className="send-v2__form-row">
        <div className="send-v2__form-label">
          {label}
          {showError && <SendRowErrorMessage errorType={errorType} />}
          {!showError && showWarning && <SendRowWarningMessage warningType={warningType} />}
          {customLabelContent}
        </div>
        <div className="send-v2__form-field">
          {formField}
        </div>
      </div>
    )
  }

}
