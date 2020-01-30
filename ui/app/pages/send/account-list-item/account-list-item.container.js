import { connect } from 'react-redux'
import {
  getConversionRate,
  getCurrentCurrency,
  getNativeCurrency,
} from '../send.selectors.js'
import {
  getIsMainnet,
  isBalanceCached,
  preferencesSelector,
} from '../../../selectors/selectors'
import AccountListItem from './account-list-item.component'

export default connect(mapStateToProps)(AccountListItem)

function mapStateToProps (state) {
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)

  return {
    conversionRate: getConversionRate(state),
    currentCurrency: getCurrentCurrency(state),
    nativeCurrency: getNativeCurrency(state),
    balanceIsCached: isBalanceCached(state),
    showFiat: (isMainnet || !!showFiatInTestnets),
  }
}
