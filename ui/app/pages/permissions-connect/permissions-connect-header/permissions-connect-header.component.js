import PropTypes from 'prop-types'
import React, { Component } from 'react'
import MetaFoxLogo from '../../../components/ui/metafox-logo'

export default class PermissionsConnectHeader extends Component {
  static propTypes = {
    page: PropTypes.number.isRequired,
  }

  render () {
    const { page } = this.props
    return (
      <div className="permissions-connect-header">
        <MetaFoxLogo
          unsetIconHeight
        />
        <div className="permissions-connect-header__page-count">
          { `${page}/2` }
        </div>
      </div>
    )
  }
}
