import { connect } from 'react-redux'

import ConnectedSitesList from './connected-sites-list.component'
import {
  showModal,
  legacyExposeAccounts,
  getOpenMetamaskTabsIds,
} from '../../../store/actions'
import {
  getRenderablePermissionsDomains,
  getPermissionsDomains,
  getSelectedAddress,
  getPermittedAccountsForCurrentTab,
} from '../../../selectors/selectors'
import { getOriginFromUrl } from '../../../helpers/utils/util'

const mapStateToProps = (state) => {
  const { openMetaMaskTabs } = state.appState
  const { title, url, id } = state.activeTab
  const permittedAccounts = getPermittedAccountsForCurrentTab(state)

  let tabToConnect

  if (url && permittedAccounts.length === 0 && !openMetaMaskTabs[id]) {
    tabToConnect = {
      title,
      origin: getOriginFromUrl(url),
    }
  }

  return {
    domains: getPermissionsDomains(state),
    renderableDomains: getRenderablePermissionsDomains(state),
    tabToConnect,
    selectedAddress: getSelectedAddress(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    showDisconnectAccountModal: (domainKey, domain) => {
      dispatch(showModal({ name: 'DISCONNECT_ACCOUNT', domainKey, domain }))
    },
    showDisconnectAllModal: () => {
      dispatch(showModal({ name: 'DISCONNECT_ALL' }))
    },
    legacyExposeAccounts: (origin, account) => {
      dispatch(legacyExposeAccounts(origin, [account]))
    },
    getOpenMetamaskTabsIds: () => dispatch(getOpenMetamaskTabsIds()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedSitesList)
