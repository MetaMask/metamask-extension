import { connect } from 'react-redux'
import TransactionActivityLog from './transaction-activity-log.component'
import { conversionRateSelector, getNativeCurrency } from '../../selectors'

const mapStateToProps = state => {
  return {
    conversionRate: conversionRateSelector(state),
    nativeCurrency: getNativeCurrency(state),
  }
}

export default connect(mapStateToProps)(TransactionActivityLog)
