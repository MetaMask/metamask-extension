import { connect } from 'react-redux'
import ConnectedSites from './connected-sites.component'
import {
  getOpenMetamaskTabsIds,
  legacyExposeAccounts,
  removePermissionsFor,
  removePermittedAccount,
} from '../../store/actions'
import {
  getConnectedDomainsForSelectedAddress,
  getCurrentAccountWithSendEtherInfo,
  getOriginOfCurrentTab,
  getSelectedAddress,
} from '../../selectors/selectors'
import {
  getPermissionsDomains,
  getPermittedAccountsByOrigin,
} from '../../selectors/permissions'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
import { getOriginFromUrl } from '../../helpers/utils/util'

const mapStateToProps = (state) => {
  const { openMetaMaskTabs } = state.appState
  const { title, url, id } = state.activeTab
  const connectedDomains = getConnectedDomainsForSelectedAddress(state)
  const originOfCurrentTab = getOriginOfCurrentTab(state)
  const permittedAccountsByOrigin = getPermittedAccountsByOrigin(state)
  const selectedAddress = getSelectedAddress(state)

  const currentTabHasNoAccounts = !permittedAccountsByOrigin[
    originOfCurrentTab
  ]?.length

  let tabToConnect
  if (url && currentTabHasNoAccounts && !openMetaMaskTabs[id]) {
    tabToConnect = {
      title,
      origin: getOriginFromUrl(url),
    }
  }

  return {
    accountLabel: getCurrentAccountWithSendEtherInfo(state).name,
    connectedDomains,
    domains: getPermissionsDomains(state),
    permittedAccountsByOrigin,
    selectedAddress,
    tabToConnect,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    getOpenMetamaskTabsIds: () => dispatch(getOpenMetamaskTabsIds()),
    disconnectAccount: (domainKey, address) => {
      dispatch(removePermittedAccount(domainKey, address))
    },
    disconnectAllAccounts: (domainKey, domain) => {
      const permissionMethodNames = domain.permissions.map(({ parentCapability }) => parentCapability)
      dispatch(removePermissionsFor({
        [domainKey]: permissionMethodNames,
      }))
    },
    legacyExposeAccounts: (origin, account) => dispatch(legacyExposeAccounts(origin, [account])),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    connectedDomains,
    domains,
    selectedAddress,
    tabToConnect,
  } = stateProps
  const {
    disconnectAccount,
    disconnectAllAccounts,
    legacyExposeAccounts: dispatchLegacyExposeAccounts,
  } = dispatchProps
  const { history } = ownProps

  const closePopover = () => history.push(DEFAULT_ROUTE)

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    closePopover,
    disconnectAccount: (domainKey) => {
      disconnectAccount(domainKey, selectedAddress)
      if (connectedDomains.length === 1) {
        closePopover()
      }
    },
    disconnectAllAccounts: (domainKey) => {
      disconnectAllAccounts(domainKey, domains[domainKey])
      if (connectedDomains.length === 1) {
        closePopover()
      }
    },
    legacyExposeAccount: () => dispatchLegacyExposeAccounts(tabToConnect.origin, selectedAddress),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(ConnectedSites)
