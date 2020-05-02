import { connect } from 'react-redux'
import {
  getNativeCurrency,
} from '../send.selectors.js'
import {
  getIsMainnet,
  isBalanceCached,
  preferencesSelector,
} from '../../../selectors'
import AccountListItem from './account-list-item.component'

export default connect(mapStateToProps)(AccountListItem)

function mapStateToProps (state) {
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)

  return {
    nativeCurrency: getNativeCurrency(state),
    balanceIsCached: isBalanceCached(state),
    showFiat: (isMainnet || !!showFiatInTestnets),
  }
}
