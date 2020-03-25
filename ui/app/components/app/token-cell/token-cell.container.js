import { connect } from 'react-redux'
import TokenCell from './token-cell.component'

function mapStateToProps (state) {
  return {
    contractExchangeRates: state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
    selectedTokenAddress: state.metamask.selectedTokenAddress,
  }
}

export default connect(mapStateToProps)(TokenCell)
