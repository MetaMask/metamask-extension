import React, { Component } from 'react'
import PropTypes from 'prop-types'
import CircleIcon from '../circle-icon'

import success from '../../../../../images/icons/green-circle-check.svg'
import danger from '../../../../../images/icons/red-triangle-exclaim.svg'
import info from '../../../../../images/icons/blue-circle-info.svg'
import warning from '../../../../../images/icons/yellow-bell.svg'

const typeConfig = {
  success: {
    circleClass: 'message-circle-icon--success',
    iconSource: success,
  },
  danger: {
    circleClass: 'message-circle-icon--danger',
    iconSource: danger,
  },
  info: {
    circleClass: 'message-circle-icon--info',
    iconSource: info,
  },
  warning: {
    circleClass: 'message-circle-icon--warning',
    iconSource: warning,
  },
}

export default class MessageCircleIcon extends Component {
  static propTypes = {
    type: PropTypes.string.isRequired,
  }

  render () {
    return (
      <CircleIcon { ...typeConfig[this.props.type] } />
    )
  }
}
