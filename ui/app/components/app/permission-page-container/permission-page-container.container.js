import { connect } from 'react-redux'
import PermissionPageContainer from './permission-page-container.component'
import {
  getSelectedIdentity,
  getPermissionsDescriptions,
  getPermissionsRequests,
  getSiteMetadata,
} from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  const requests = getPermissionsRequests(state) || []
  const requestedPermissions = requests[0].permissions || {}
  const requestedPermissionsKeys = Object.keys(requestedPermissions)
  const permissionsDescriptions = getPermissionsDescriptions(state)
  const requestedPermissionsDescriptions = requestedPermissionsKeys.reduce((acc, requestedPermissionKey) => {
    const isWildCardPermission = requestedPermissionKey.match(/([A-z0-9]+_[A-z0-9]+_)([A-z0-9\:\/\.]+)/)

    let permissionDescription

    if (permissionsDescriptions[requestedPermissionKey]) {
      permissionDescription = permissionsDescriptions[requestedPermissionKey]
    } else if (isWildCardPermission) {
      const wildCardPermissionType = isWildCardPermission[1]
      const wildCardPermissionName = isWildCardPermission[2]
      const wildCardPermissionDescription = permissionsDescriptions[wildCardPermissionType + '*']
      permissionDescription = wildCardPermissionDescription
        .replace('$1', wildCardPermissionName)

      if (wildCardPermissionType === 'eth_addPlugin_') {
        const { caveats } = requestedPermissions[requestedPermissionKey]
        const forceParamsCaveat = caveats.find(caveat => caveat.type === 'forceParams')
        const { sourceUrl } = forceParamsCaveat && forceParamsCaveat.value[0] || {}

        permissionDescription = permissionDescription.replace('$2', sourceUrl)
      }
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
    siteMetadata: getSiteMetadata(state),
  }
}

export default connect(mapStateToProps)(PermissionPageContainer)
