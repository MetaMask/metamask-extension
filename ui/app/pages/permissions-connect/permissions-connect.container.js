import { connect } from 'react-redux'
import PermissionApproval from './permissions-connect.component'
import {
  getFirstPermissionRequest,
  getNativeCurrency,
  getAccountsWithLabels,
} from '../../selectors/selectors'
import { approvePermissionsRequest, rejectPermissionsRequest, showModal, getOpenMetaMaskTabs, getCurrentWindowTab } from '../../store/actions'

const mapStateToProps = state => {
  const permissionsRequest = getFirstPermissionRequest(state)
  const { metadata = {} } = permissionsRequest || {}
  const { origin } = metadata
  const nativeCurrency = getNativeCurrency(state)

  const accountsWithLabels = getAccountsWithLabels(state)

  const { openMetaMaskTabs = {}, currentWindowTab = {} } = state.appState
  const currentOpenMetaMaskTab = openMetaMaskTabs[currentWindowTab.id] || {}

  return {
    permissionsRequest,
    accounts: accountsWithLabels,
    originName: origin,
    newAccountNumber: accountsWithLabels.length + 1,
    nativeCurrency,
    currentMetaMaskTabOpenerId: currentOpenMetaMaskTab.opener,
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
    getOpenMetaMaskTabs: () => dispatch(getOpenMetaMaskTabs()),
    getCurrentWindowTab: () => dispatch(getCurrentWindowTab()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PermissionApproval)
