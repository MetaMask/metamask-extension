import { connect } from 'react-redux'
import { compose } from 'recompose'

import ConnectedSitesList from './connected-sites-list.component'
import {
  showModal,
  legacyExposeAccounts,
  getOpenMetamaskTabsIds,
} from '../../../store/actions'
import {
  getRenderablePermissionsDomains,
  getPermissionsDomains,
  getAddressConnectedToCurrentTab,
  getSelectedAddress,
} from '../../../selectors/selectors'
import { getOriginFromUrl } from '../../../helpers/utils/util'

const mapStateToProps = state => {
  const addressConnectedToCurrentTab = getAddressConnectedToCurrentTab(state)
  const { openMetaMaskTabs } = state.appState
  const { title, url, id } = state.activeTab

  let tabToConnect

  if (!addressConnectedToCurrentTab && url && !openMetaMaskTabs[id]) {
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

const mapDispatchToProps = dispatch => {
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

export default compose(
  connect(mapStateToProps, mapDispatchToProps)
)(ConnectedSitesList)
