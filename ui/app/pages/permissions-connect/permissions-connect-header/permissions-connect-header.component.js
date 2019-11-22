import PropTypes from 'prop-types'
import React, { Component } from 'react'
import MetaFoxLogo from '../../../components/ui/metafox-logo'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'

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
          onClick={() => history.push(DEFAULT_ROUTE)}
        />
        <div className="permissions-connect-header__page-count">
          { `${page}/2` }
        </div>
      </div>
    )
  }
}
