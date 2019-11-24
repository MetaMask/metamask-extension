import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import WalletView from './wallet-view.component'
import {showSendPage, hideSidebar, setSelectedToken, showAddTokenPage} from '../../../store/actions'
import * as selectors from '../../../selectors/selectors'

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    sidebarOpen: state.appState.sidebar.isOpen,
    identities: state.metamask.identities,
    accounts: selectors.getMetaMaskAccounts(state),
    keyrings: state.metamask.keyrings,
    selectedAddress: selectors.getSelectedAddress(state),
    selectedAccount: selectors.getSelectedAccount(state),
    selectedTokenAddress: state.metamask.selectedTokenAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showSendPage: () => dispatch(showSendPage()),
    hideSidebar: () => dispatch(hideSidebar()),
    unsetSelectedToken: () => dispatch(setSelectedToken()),
    showAddTokenPage: () => dispatch(showAddTokenPage()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(WalletView)
