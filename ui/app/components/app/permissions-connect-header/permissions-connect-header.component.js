import PropTypes from 'prop-types'
import React, { Component } from 'react'
import IconWithFallBack from '../../ui/icon-with-fallback'

export default class PermissionsConnectHeader extends Component {
  static propTypes = {
    icon: PropTypes.string,
    iconName: PropTypes.string.isRequired,
    headerTitle: PropTypes.node,
    headerText: PropTypes.string,
  }

  static defaultProps = {
    icon: null,
    headerTitle: '',
    headerText: '',
  }

  renderHeaderIcon () {
    const { icon, iconName } = this.props

    return (
      <div className="permissions-connect-header__icon">
        <IconWithFallBack icon={ icon } name={ iconName } />
        <div className="permissions-connect-header__text">{iconName }</div>
      </div>
    )
  }

  render () {
    const { headerTitle, headerText } = this.props
    return (
      <div className="permissions-connect-header">
        { this.renderHeaderIcon() }
        <div className="permissions-connect-header__title">
          { headerTitle }
        </div>
        <div className="permissions-connect-header__text">
          { headerText }
        </div>
      </div>
    )
  }
}
