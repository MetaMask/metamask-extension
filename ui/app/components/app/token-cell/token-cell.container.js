import { connect } from 'react-redux'
import TokenCell from './token-cell.component'
import { getSelectedAddress } from '../../../selectors'

function mapStateToProps (state) {
  return {
    contractExchangeRates: state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
    userAddress: getSelectedAddress(state),
  }
}

export default connect(mapStateToProps)(TokenCell)
