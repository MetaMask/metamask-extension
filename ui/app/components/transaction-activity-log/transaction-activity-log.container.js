import { connect } from 'react-redux'
import TransactionActivityLog from './transaction-activity-log.component'
import { conversionRateSelector } from '../../selectors'

const mapStateToProps = state => {
  return {
    conversionRate: conversionRateSelector(state),
  }
}

export default connect(mapStateToProps)(TransactionActivityLog)
