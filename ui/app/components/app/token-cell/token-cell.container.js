import { connect } from 'react-redux'
import { setSelectedToken, hideSidebar } from '../../../store/actions'
import { getSelectedAddress } from '../../../selectors/selectors'
import TokenCell from './token-cell.component'

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    currentCurrency: state.metamask.currentCurrency,
    selectedTokenAddress: state.metamask.selectedTokenAddress,
    userAddress: getSelectedAddress(state),
    contractExchangeRates: state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate,
    sidebarOpen: state.appState.sidebar.isOpen,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setSelectedToken: (address) => dispatch(setSelectedToken(address)),
    hideSidebar: () => dispatch(hideSidebar()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TokenCell)
