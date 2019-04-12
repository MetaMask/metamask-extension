import { connect } from 'react-redux'
import PermissionPageContainerContent from './permission-page-container-content.component'
import { getSelectedIdentity, getPermissionsDescriptions } from '../../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    selectedIdentity: getSelectedIdentity(state),
    permissionsDescriptions: getPermissionsDescriptions(state),
  }
}

export default connect(mapStateToProps)(PermissionPageContainerContent)
