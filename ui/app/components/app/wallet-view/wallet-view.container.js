import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import WalletView from './wallet-view.component'
import { hideSidebar, setSelectedToken } from '../../../store/actions'
import {
  getSelectedAddress,
  getSelectedBase32Address,
  getSelectedAccount,
} from '../../../selectors/selectors'

function mapStateToProps(state) {
  return {
    sidebarOpen: state.appState.sidebar.isOpen,
    identities: state.metamask.identities,
    keyrings: state.metamask.keyrings,
    selectedAddress: getSelectedAddress(state),
    selectedBase32Address: getSelectedBase32Address(state),
    selectedAccount: getSelectedAccount(state),
    selectedTokenAddress: state.metamask.selectedTokenAddress,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    hideSidebar: () => dispatch(hideSidebar()),
    unsetSelectedToken: () => dispatch(setSelectedToken()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(WalletView)
