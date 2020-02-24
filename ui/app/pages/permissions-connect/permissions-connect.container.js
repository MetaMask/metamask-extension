import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import PermissionApproval from './permissions-connect.component'
import {
  getPermissionsRequests,
  getNativeCurrency,
  getAccountsWithLabels,
  getLastConnectedInfo,
  getPermissionsDomains,
} from '../../selectors/selectors'
import { formatDate } from '../../helpers/utils/util'
import { approvePermissionsRequest, rejectPermissionsRequest, showModal, getCurrentWindowTab, getRequestAccountTabIds } from '../../store/actions'

const mapStateToProps = (state, ownProps) => {
  const { match: { params: { id: permissionsRequestId } } } = ownProps
  const permissionsRequests = getPermissionsRequests(state)

  const permissionsRequest = permissionsRequests
    .find((permissionsRequest) => permissionsRequest.metadata.id === permissionsRequestId)

  const { metadata = {} } = permissionsRequest || {}
  const { origin } = metadata
  const nativeCurrency = getNativeCurrency(state)

  const accountsWithLabels = getAccountsWithLabels(state)

  const { requestAccountTabs = {} } = state.appState

  const lastConnectedInfo = getLastConnectedInfo(state) || {}
  const addressLastConnectedMap = lastConnectedInfo[origin] || {}

  Object.keys(addressLastConnectedMap).forEach((key) => {
    addressLastConnectedMap[key] = formatDate(addressLastConnectedMap[key], 'yyyy-M-d')
  })

  return {
    permissionsRequest,
    permissionsRequestId,
    accounts: accountsWithLabels,
    originName: origin,
    newAccountNumber: accountsWithLabels.length + 1,
    nativeCurrency,
    requestAccountTabs,
    addressLastConnectedMap,
    domains: getPermissionsDomains(state),
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
