import { connect } from 'react-redux'
import PermissionPageContainer from './permission-page-container.component'
import {
  getSelectedIdentity,
  getPermissionsDescriptions,
  getPermissionsRequests,
  getDomainMetadata,
} from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    requests: getPermissionsRequests(state),
    selectedIdentity: getSelectedIdentity(state),
    permissionsDescriptions: getPermissionsDescriptions(state),
    domainMetadata: getDomainMetadata(state),
  }
}

export default connect(mapStateToProps)(PermissionPageContainer)
