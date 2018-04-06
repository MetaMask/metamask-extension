import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowErrorMessage from './send-row-error-message/send-row-error-message.container'

export default class SendRowWrapper extends Component {

  static propTypes = {
    label: PropTypes.string,
    showError: PropTypes.bool,
    children: PropTypes.node,
    errorType: PropTypes.string,
  };

  render () {
    const {
        label,
        errorType = '',
        showError = false,
        children,
    } = this.props

    return (
      <div className="send-v2__form-row">
        <div className="send-v2__form-label">
            {label}
            (showError && <SendRowErrorMessage errorType={errorType}/>)
        </div>
        <div className="send-v2__form-field">
            {children}
        </div>
      </div>
    );
  }

}

SendRowWrapper.contextTypes = {
  t: PropTypes.func,
}
