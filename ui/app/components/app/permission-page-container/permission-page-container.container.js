import { connect } from 'react-redux'
import PermissionPageContainer from './permission-page-container.component'
import {
  getPermissionsDescriptions,
  getTargetDomainMetadata,
} from '../../../selectors/selectors'

const mapStateToProps = (state, ownProps) => {
  const { request, cachedOrigin } = ownProps
  const targetDomainMetadata = getTargetDomainMetadata(state, request, cachedOrigin)

  return {
    permissionsDescriptions: getPermissionsDescriptions(state),
    targetDomainMetadata,
  }
}

export default connect(mapStateToProps)(PermissionPageContainer)
