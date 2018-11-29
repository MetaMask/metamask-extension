import { connect } from 'react-redux'
import {
    getConversionRate,
    getCurrentCurrency,
    getNativeCurrency,
} from '../send.selectors.js'
import {
  isBalanceCached,
} from '../../../selectors'
import AccountListItem from './account-list-item.component'

export default connect(mapStateToProps)(AccountListItem)

function mapStateToProps (state) {
  return {
    conversionRate: getConversionRate(state),
    currentCurrency: getCurrentCurrency(state),
    nativeCurrency: getNativeCurrency(state),
    balanceIsCached: isBalanceCached(state),
  }
}
