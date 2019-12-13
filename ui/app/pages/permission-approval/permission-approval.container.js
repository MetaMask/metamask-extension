import { connect } from 'react-redux'
import PermissionApproval from './permission-approval.component'
import { approvePermissionsRequest, rejectPermissionsRequest } from '../../store/actions'

function mapDispatchToProps (dispatch) {
  return {
    approvePermissionsRequest: (requestId, accounts) => dispatch(approvePermissionsRequest(requestId, accounts)),
    rejectPermissionsRequest: requestId => dispatch(rejectPermissionsRequest(requestId)),
  }
}

export default connect(null, mapDispatchToProps)(PermissionApproval)
