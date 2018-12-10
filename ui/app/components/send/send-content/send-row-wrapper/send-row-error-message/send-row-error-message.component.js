import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class SendRowErrorMessage extends Component {

  static propTypes = {
    errors: PropTypes.object,
    errorType: PropTypes.string,
    customErrors: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { errors, errorType, customErrors } = this.props

    const errorMessage = errors[errorType] || customErrors[errorType]

    return (
      errorMessage
        ? <div className="send-v2__error">{this.context.t(errorMessage)}</div>
        : null
    )
  }

}
