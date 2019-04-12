import { connect } from 'react-redux'
import PermissionPageContainer from './permission-page-container.component'
import { getSelectedIdentity, getPermissionsDescriptions, getPermissionsRequests } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    requests: getPermissionsRequests(state),
    selectedIdentity: getSelectedIdentity(state),
    permissionsDescriptions: getPermissionsDescriptions(state),
  }
}

export default connect(mapStateToProps)(PermissionPageContainer)
