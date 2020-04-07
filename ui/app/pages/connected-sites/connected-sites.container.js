import { connect } from 'react-redux'
import ConnectedSites from './connected-sites.component'
import { getOpenMetamaskTabsIds, legacyExposeAccounts, removePermissionsFor } from '../../store/actions'
import {
  getCurrentAccountWithSendEtherInfo,
  getPermissionsDomains,
  getPermittedAccountsForCurrentTab,
  getRenderablePermissionsDomains,
  getSelectedAddress,
} from '../../selectors/selectors'
import { getOriginFromUrl } from '../../helpers/utils/util'

const mapStateToProps = (state) => {
  const { openMetaMaskTabs } = state.appState
  const { title, url, id } = state.activeTab
  const permittedAccounts = getPermittedAccountsForCurrentTab(state)
  const connectedDomains = getRenderablePermissionsDomains(state)

  let tabToConnect
  if (url && permittedAccounts.length === 0 && !openMetaMaskTabs[id]) {
    tabToConnect = {
      title,
      origin: getOriginFromUrl(url),
    }
  }

  return {
    accountLabel: getCurrentAccountWithSendEtherInfo(state).name,
    connectedDomains,
    domains: getPermissionsDomains(state),
    selectedAddress: getSelectedAddress(state),
    tabToConnect,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    getOpenMetamaskTabsIds: () => dispatch(getOpenMetamaskTabsIds()),
    disconnectAccount: (domainKey, domain) => {
      const permissionMethodNames = domain.permissions.map(({ parentCapability }) => parentCapability)
      dispatch(removePermissionsFor({
        [domainKey]: permissionMethodNames,
      }))
    },
    legacyExposeAccounts: (origin, account) => dispatch(legacyExposeAccounts(origin, [account])),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { domains, selectedAddress, tabToConnect } = stateProps
  const {
    disconnectAccount,
    legacyExposeAccounts: dispatchLegacyExposeAccounts,
  } = dispatchProps

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    disconnectAccount: (domainKey) => disconnectAccount(domainKey, domains[domainKey]),
    legacyExposeAccount: () => dispatchLegacyExposeAccounts(tabToConnect.origin, selectedAddress),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(ConnectedSites)
