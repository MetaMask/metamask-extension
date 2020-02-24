import { connect } from 'react-redux'
import PermissionPageContainer from './permission-page-container.component'
import {
  getPermissionsDescriptions,
  getDomainMetadata,
} from '../../../selectors/selectors'

const mapStateToProps = (state, ownProps) => {
  const { request, cachedOrigin } = ownProps
  const { metadata: requestMetadata = {} } = request || {}

  const domainMetadata = getDomainMetadata(state)
  const origin = requestMetadata.origin || cachedOrigin
  const targetDomainMetadata = (domainMetadata[origin] || { name: origin, icon: null })

  return {
    permissionsDescriptions: getPermissionsDescriptions(state),
    requestMetadata,
    targetDomainMetadata,
  }
}

export default connect(mapStateToProps)(PermissionPageContainer)
