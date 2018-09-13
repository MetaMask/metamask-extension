import { connect } from 'react-redux'
import TransactionActivityLog from './transaction-activity-log.component'
import { conversionRateSelector, getFromCurrency } from '../../selectors'

const mapStateToProps = state => {
  return {
    conversionRate: conversionRateSelector(state),
    fromCurrency: getFromCurrency(state),
  }
}

export default connect(mapStateToProps)(TransactionActivityLog)
