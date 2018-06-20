import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class SendRowErrorMessage extends Component {

  static propTypes = {
    errors: PropTypes.object,
    errorType: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { errors, errorType } = this.props

    const errorMessage = errors[errorType]

    return (
      errorMessage
        ? <div className="send-v2__error">{this.context.t(errorMessage)}</div>
        : null
    )
  }

}
