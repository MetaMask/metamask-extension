import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import WalletView from './wallet-view.component'
import { hideSidebar } from '../../../store/actions'
import { getSelectedAddress } from '../../../selectors/selectors'

function mapStateToProps (state) {
  return {
    sidebarOpen: state.appState.sidebar.isOpen,
    identities: state.metamask.identities,
    keyrings: state.metamask.keyrings,
    selectedAddress: getSelectedAddress(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideSidebar: () => dispatch(hideSidebar()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(WalletView)
