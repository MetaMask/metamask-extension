import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowErrorMessage from './send-row-error-message/'

export default class SendRowWrapper extends Component {

  static propTypes = {
    children: PropTypes.node,
    errorType: PropTypes.string,
    label: PropTypes.string,
    showError: PropTypes.bool,
  };

  render () {
    const {
      children,
      errorType = '',
      label,
      showError = false,
    } = this.props

    const formField = Array.isArray(children) ? children[1] || children[0] : children
    const customLabelContent = children.length > 1 ? children[0] : null

    return (
      <div className="send-v2__form-row">
        <div className="send-v2__form-label">
            {label}
            {showError && <SendRowErrorMessage errorType={errorType}/>}
            {customLabelContent}
        </div>
        <div className="send-v2__form-field">
            {formField}
        </div>
      </div>
    )
  }

}

SendRowWrapper.contextTypes = {
  t: PropTypes.func,
}
