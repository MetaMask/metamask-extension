import { connect } from 'react-redux'
import { setSelectedToken, hideSidebar } from '../../../store/actions'
import TokenCell from './token-cell.component'

function mapStateToProps (state) {
  return {
    contractExchangeRates: state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
    selectedTokenAddress: state.metamask.selectedTokenAddress,
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
