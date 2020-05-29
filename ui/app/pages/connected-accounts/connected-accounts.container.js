import { connect } from 'react-redux'
import ConnectedAccounts from './connected-accounts.component'
import {
  getAccountToConnectToActiveTab,
  getOrderedConnectedAccountsForActiveTab,
  getPermissionsForActiveTab,
  getSelectedAddress,
} from '../../selectors'
import { addPermittedAccount, removePermittedAccount, setSelectedAddress } from '../../store/actions'

const EXT_PROTOCOLS = ['chrome-extension:', 'moz-extension:']

const mapStateToProps = (state) => {
  const { activeTab } = state
  const accountToConnect = getAccountToConnectToActiveTab(state)
  const connectedAccounts = getOrderedConnectedAccountsForActiveTab(state)
  const permissions = getPermissionsForActiveTab(state)
  const selectedAddress = getSelectedAddress(state)

  const isActiveTabExtension = EXT_PROTOCOLS.includes(activeTab.protocol)
  return {
    accountToConnect,
    isActiveTabExtension,
    activeTabOrigin: activeTab.origin,
    connectedAccounts,
    permissions,
    selectedAddress,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addPermittedAccount: (origin, address) => dispatch(addPermittedAccount(origin, address)),
    removePermittedAccount: (origin, address) => dispatch(removePermittedAccount(origin, address)),
    setSelectedAddress: (address) => dispatch(setSelectedAddress(address)),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { activeTabOrigin: origin } = stateProps

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    addPermittedAccount: (address) => dispatchProps.addPermittedAccount(origin, address),
    removePermittedAccount: (address) => dispatchProps.removePermittedAccount(origin, address),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(ConnectedAccounts)
