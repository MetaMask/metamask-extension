import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DepositLayer2AppRowErrorMessage from './deposit-layer2-app-row-error-message/'

export default class SendRowWrapper extends Component {

  static propTypes = {
    children: PropTypes.node,
    errorType: PropTypes.string,
    label: PropTypes.string,
    showError: PropTypes.bool,
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
    } = this.props

    const formField = Array.isArray(children) ? children[1] || children[0] : children
    const customLabelContent = children.length > 1 ? children[0] : null

    return (
      <div className="send-v2__form-row">
        <div className="send-v2__form-label">
            {label}
            {showError && <DepositLayer2AppRowErrorMessage errorType={errorType}/>}
            {customLabelContent}
        </div>
        <div className="send-v2__form-field">
            {formField}
        </div>
      </div>
    )
  }

}
