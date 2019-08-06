import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class SendRowWarningMessage extends Component {

  static propTypes = {
    warnings: PropTypes.object,
    warningType: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { warnings, warningType } = this.props

    const warningMessage = warningType in warnings && warnings[warningType]

    return (
      warningMessage
        ? <div className="send-v2__warning">{this.context.t(warningMessage)}</div>
        : null
    )
  }

}
