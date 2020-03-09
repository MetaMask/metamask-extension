import React, { Component } from 'react'
import PropTypes from 'prop-types'
import CircleIcon from '../circle-icon'

import danger from '../../../../../app/images/icons/red-triangle-exclaim.svg'
import warning from '../../../../../app/images/icons/yellow-bell.svg'

const typeConfig = {
  danger: {
    circleClass: 'message-circle-icon--danger',
    iconSource: danger,
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
