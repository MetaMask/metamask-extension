import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import PermissionApproval from './permissions-connect.component'
import {
  getPermissionsRequests,
  getNativeCurrency,
  getAccountsWithLabels,
  getLastConnectedInfo,
  getTargetDomainMetadata,

  getPermissionDomains,
} from '../../selectors'

import { formatDate } from '../../helpers/utils/util'
import { approvePermissionsRequest, rejectPermissionsRequest, showModal, getCurrentWindowTab, getRequestAccountTabIds } from '../../store/actions'
import {
  CONNECT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
} from '../../helpers/constants/routes'

const mapStateToProps = (state, ownProps) => {
  const {
    match: { params: { id: permissionsRequestId } },
    location: { pathname },
  } = ownProps
  const permissionsRequests = getPermissionsRequests(state)

  const permissionsRequest = permissionsRequests
    .find((permissionsRequest) => permissionsRequest.metadata.id === permissionsRequestId)

  const { metadata = {} } = permissionsRequest || {}
  const { origin } = metadata
  const nativeCurrency = getNativeCurrency(state)

  const accountsWithLabels = getAccountsWithLabels(state)

  const lastConnectedInfo = getLastConnectedInfo(state) || {}
  const addressLastConnectedMap = lastConnectedInfo[origin] || {}

  Object.keys(addressLastConnectedMap).forEach((key) => {
    addressLastConnectedMap[key] = formatDate(addressLastConnectedMap[key], 'yyyy-MM-dd')
  })

  const connectPath = `${CONNECT_ROUTE}/${permissionsRequestId}`
  const confirmPermissionPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_CONFIRM_PERMISSIONS_ROUTE}`

  let page = ''
  if (pathname === connectPath) {
    page = '1'
  } else if (pathname === confirmPermissionPath) {
    page = '2'
  } else {
    throw new Error('Incorrect path for permissions-connect component')
  }

  const targetDomainMetadata = getTargetDomainMetadata(state, permissionsRequest, origin)

  return {
    permissionsRequest,
    permissionsRequestId,
    accounts: accountsWithLabels,
    originName: origin,
    newAccountNumber: accountsWithLabels.length + 1,
    nativeCurrency,
    addressLastConnectedMap,
    domains: getPermissionDomains(state),
    connectPath,
    confirmPermissionPath,
    page,
    targetDomainMetadata,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    approvePermissionsRequest: (request, accounts) => dispatch(approvePermissionsRequest(request, accounts)),
    rejectPermissionsRequest: (requestId) => dispatch(rejectPermissionsRequest(requestId)),
    showNewAccountModal: ({ onCreateNewAccount, newAccountNumber }) => {
      return dispatch(showModal({
        name: 'NEW_ACCOUNT',
        onCreateNewAccount,
        newAccountNumber,
      }))
    },
    getRequestAccountTabIds: () => dispatch(getRequestAccountTabIds()),
    getCurrentWindowTab: () => dispatch(getCurrentWindowTab()),
  }
}

const PermissionApprovalContainer = connect(mapStateToProps, mapDispatchToProps)(PermissionApproval)

PermissionApprovalContainer.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
}

export default PermissionApprovalContainer
