import { connect } from 'react-redux'
import ConnectedSites from './connected-sites.component'
import {
  getOpenMetamaskTabsIds,
  legacyExposeAccounts,
  removePermissionsFor,
} from '../../store/actions'
import {
  getConnectedDomainsForSelectedAddress,
  getCurrentAccountWithSendEtherInfo,
  getPermissionsDomains,
  getPermittedAccountsForCurrentTab,
  getSelectedAddress,
} from '../../selectors/selectors'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
import { getOriginFromUrl } from '../../helpers/utils/util'

const mapStateToProps = (state) => {
  const { openMetaMaskTabs } = state.appState
  const { title, url, id } = state.activeTab
  const permittedAccounts = getPermittedAccountsForCurrentTab(state)
  const connectedDomains = getConnectedDomainsForSelectedAddress(state)

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
    disconnectSite: (domainKey, domain) => {
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
    domains,
    selectedAddress,
    tabToConnect,
    connectedDomains,
  } = stateProps
  const {
    disconnectSite,
    legacyExposeAccounts: dispatchLegacyExposeAccounts,
  } = dispatchProps
  const { history } = ownProps

  const closePopover = () => history.push(DEFAULT_ROUTE)

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    closePopover,
    disconnectSite: (domainKey) => {
      disconnectSite(domainKey, domains[domainKey])
      if (connectedDomains.length === 1) {
        closePopover()
      }
    },
    legacyExposeAccount: () => dispatchLegacyExposeAccounts(tabToConnect.origin, selectedAddress),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(ConnectedSites)
