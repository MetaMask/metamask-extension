import { connect } from 'react-redux'
import PermissionPageContainer from './permission-page-container.component'
import {
  getSelectedIdentity,
  getPermissionsDescriptions,
  getPermissionsRequests,
  getDomainMetadata,
} from '../../../selectors/selectors'
import { hideLoadingIndication, showLoadingIndication } from '../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    hideLoadingIndication: () => dispatch(hideLoadingIndication),
    showLoadingIndication: () => dispatch(showLoadingIndication),
  }
}

const mapStateToProps = (state) => {
  const requests = getPermissionsRequests(state) || []
  const requestedPermissions = requests[0].permissions || {}
  const requestedPermissionsKeys = Object.keys(requestedPermissions)
  const permissionsDescriptions = getPermissionsDescriptions(state)
  const requestedPermissionsDescriptions = requestedPermissionsKeys.reduce((acc, requestedPermissionKey) => {
    const requestedPermissionKeyParts = requestedPermissionKey.split('_')
    // TODO we should check if this matches a wildcare permission in a better way
    const isWildCardPermission = requestedPermissionKeyParts.length === 3

    let permissionDescription

    if (permissionsDescriptions[requestedPermissionKey]) {
      permissionDescription = permissionsDescriptions[requestedPermissionKey]
    } else if (isWildCardPermission) {
      const wildCardPermissionParameter = requestedPermissionKeyParts[2]
      const wildCardPermissionFixedSegement = requestedPermissionKeyParts.slice(0, 2).join('_')
      const wildCardPermissionDescription = permissionsDescriptions[`${wildCardPermissionFixedSegement}_*`]
      permissionDescription = wildCardPermissionDescription
        .replace('$1', wildCardPermissionParameter)
    }

    return {
      ...acc,
      [requestedPermissionKey]: permissionDescription,
    }
  }, {})

  return {
    requests,
    selectedIdentity: getSelectedIdentity(state),
    permissionsDescriptions: requestedPermissionsDescriptions,
    domainMetadata: getDomainMetadata(state),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PermissionPageContainer)
