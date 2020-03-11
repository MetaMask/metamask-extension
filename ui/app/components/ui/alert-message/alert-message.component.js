import React, { Component } from 'react'
import PropTypes from 'prop-types'
import BoxedMessage from '../boxed-message'

const typeConfig = {
  success: {
    boxClass: 'alert-message--success',
    iconSource: '/images/icons/green-circle-check.svg',
  },
  danger: {
    boxClass: 'alert-message--danger',
    iconSource: '/images/icons/red-triangle-exclaim.svg',
  },
  info: {
    boxClass: 'alert-message--info',
    iconSource: '/images/icons/blue-circle-info.svg',
  },
  warning: {
    boxClass: 'alert-message--warning',
    iconSource: '/images/icons/yellow-bell.svg',
  },
}

export default class AlertMessage extends Component {
  static propTypes = {
    type: PropTypes.oneOf(Object.keys(typeConfig)).isRequired,
    children: PropTypes.node,
  }

  render () {
    return (
      <BoxedMessage
        { ...typeConfig[this.props.type] }
        message={this.props.children}
        { ...this.props }
      />
    )
  }
}
