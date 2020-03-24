import React, { Component } from 'react'
import PropTypes from 'prop-types'
import BoxedMessage from '../boxed-message'

import success from '../../../../../app/images/icons/green-circle-check.svg'
import danger from '../../../../../app/images/icons/red-triangle-exclaim.svg'
import info from '../../../../../app/images/icons/blue-circle-info.svg'
import warning from '../../../../../app/images/icons/yellow-bell.svg'

const typeConfig = {
  success: {
    boxClass: 'toast-message--success',
    iconSource: success,
  },
  danger: {
    boxClass: 'toast-message--danger',
    iconSource: danger,
  },
  info: {
    boxClass: 'toast-message--info',
    iconSource: info,
  },
  warning: {
    boxClass: 'toast-message--warning',
    iconSource: warning,
  },
}

export default class ToastMessage extends Component {
  static propTypes = {
    type: PropTypes.oneOf(Object.keys(typeConfig)).isRequired,
    children: PropTypes.node,
  }

  render () {
    return (
      <BoxedMessage
        { ...typeConfig[this.props.type] }
        { ...this.props }
      >
        { this.props.children }
      </BoxedMessage>
    )
  }
}
