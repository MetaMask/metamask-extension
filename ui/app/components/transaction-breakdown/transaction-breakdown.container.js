import { connect } from 'react-redux'
import TransactionBreakdown from './transaction-breakdown.component'
import { getNativeCurrency } from '../../selectors'

const mapStateToProps = (state) => {
  return {
    nativeCurrency: getNativeCurrency(state),
  }
}

export default connect(mapStateToProps)(TransactionBreakdown)
