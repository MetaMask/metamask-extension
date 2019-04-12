import PropTypes from 'prop-types'
import React, { Component } from 'react'
import PermissionPageContainer from '../../components/app/permission-page-container'

export default class PermissionApproval extends Component {
  static propTypes = {
    approvePermissionRequest: PropTypes.func.isRequired,
    permissionRequest: PropTypes.object.isRequired,
    rejectPermissionRequest: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const { approvePermissionRequest, permissionRequest, rejectPermissionRequest } = this.props
    return (
      <PermissionPageContainer
        approvePermissionRequest={approvePermissionRequest}
        rejectPermissionRequest={rejectPermissionRequest}
        request={permissionRequest}
      />
    )
  }
}
