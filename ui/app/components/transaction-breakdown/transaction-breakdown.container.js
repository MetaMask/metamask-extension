import { connect } from 'react-redux'
import TransactionBreakdown from './transaction-breakdown.component'
import {getIsMainnet, getNativeCurrency, preferencesSelector} from '../../selectors'

const mapStateToProps = (state) => {
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)

  return {
    nativeCurrency: getNativeCurrency(state),
    showFiat: (isMainnet || !!showFiatInTestnets),
  }
}

export default connect(mapStateToProps)(TransactionBreakdown)
