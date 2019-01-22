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
    console.log('from SendRowWarningMessage', warningMessage, warnings, warningType)

    const warningMessage = warnings[warningType]

    return (
        warningMessage
        ? <div className="send-v2__error">{this.context.t(warningMessage)}</div>
        : null
    )
  }

}
