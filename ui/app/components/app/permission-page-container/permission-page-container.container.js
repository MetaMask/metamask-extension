import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import PermissionPageContainer from './permission-page-container.component'
import {
  getSelectedIdentity,
  getPermissionsDescriptions,
  getPermissionsRequests,
  getDomainMetadata,
  getFirstPermissionRequest,
} from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  return {
    permissionsDescriptions: getPermissionsDescriptions(state),
    domainMetadata: getDomainMetadata(state),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(PermissionPageContainer)
