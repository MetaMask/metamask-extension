import PropTypes from 'prop-types'
import React, { Component } from 'react'
import PermissionPageContainer from '../../components/app/permission-page-container'

export default class PermissionApproval extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    permissionsRequests: PropTypes.array.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { approvePermissionsRequest, permissionsRequests, rejectPermissionsRequest } = this.props
    return (
      <PermissionPageContainer
        approvePermissionsRequest={approvePermissionsRequest}
        rejectPermissionsRequest={rejectPermissionsRequest}
        requests={permissionsRequests}
      />
    )
  }
}
