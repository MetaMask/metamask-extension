import { connect } from 'react-redux'
import PermissionApproval from './permissions-connect.component'
import {
  accountsWithSendEtherInfoSelector,
  getFirstPermissionRequest,
  getNativeCurrency,
} from '../../selectors/selectors'
import { approvePermissionsRequest, rejectPermissionsRequest, showModal, getOpenMetaMaskTabs, getCurrentWindowTab } from '../../store/actions'

const mapStateToProps = state => {
  const permissionsRequest = getFirstPermissionRequest(state)
  const { metadata = {} } = permissionsRequest || {}
  const { origin } = metadata
  const nativeCurrency = getNativeCurrency(state)

  const accountsWithoutLabel = accountsWithSendEtherInfoSelector(state)
  const accountsWithLabel = accountsWithoutLabel.map(account => {
    const { address, name, balance } = account
    return {
      address,
      truncatedAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      addressLabel: `${name} (...${address.slice(address.length - 4)})`,
      label: name,
      balance,
    }
  })

  const { openMetaMaskTabs = {}, currentWindowTab = {} } = state.appState
  const currentOpenMetaMaskTab = openMetaMaskTabs[currentWindowTab.id] || {}

  return {
    permissionsRequest,
    accounts: accountsWithLabel,
    originName: origin,
    newAccountNumber: accountsWithLabel.length + 1,
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
