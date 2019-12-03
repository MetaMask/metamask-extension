import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import PermissionApproval from './permissions-connect.component'
import {
  getFirstPermissionRequest,
  getNativeCurrency,
  getAccountsWithLabels,
  getLastConnectedInfo,
  getPermissionsDomains,
} from '../../selectors/selectors'
import { formatDate } from '../../helpers/utils/util'
import { approvePermissionsRequest, rejectPermissionsRequest, showModal, getCurrentWindowTab, getRequestAccountTabIds } from '../../store/actions'

const mapStateToProps = state => {
  const permissionsRequest = getFirstPermissionRequest(state)
  const { metadata = {} } = permissionsRequest || {}
  const { origin } = metadata
  const nativeCurrency = getNativeCurrency(state)

  const accountsWithLabels = getAccountsWithLabels(state)

  const { requestAccountTabs = {} } = state.appState

  const lastConnectedInfo = getLastConnectedInfo(state) || {}
  const addressLastConnectedMap = lastConnectedInfo[origin] || {}

  Object.keys(addressLastConnectedMap).forEach(key => {
    addressLastConnectedMap[key] = formatDate(addressLastConnectedMap[key], 'yyyy-M-d')
  })

  const permissionsRequestId = (permissionsRequest && permissionsRequest.metadata) ? permissionsRequest.metadata.id : null

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

const mapDispatchToProps = dispatch => {
  return {
    approvePermissionsRequest: (requestId, accounts) => dispatch(approvePermissionsRequest(requestId, accounts)),
    rejectPermissionsRequest: requestId => dispatch(rejectPermissionsRequest(requestId)),
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

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(PermissionApproval)
