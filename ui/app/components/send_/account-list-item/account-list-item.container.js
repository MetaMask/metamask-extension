import { connect } from 'react-redux'
import {
    getConversionRate,
    getConvertedCurrency,
} from '../send.selectors.js'
import AccountListItem from './account-list-item.component'

export default connect(mapStateToProps)(AccountListItem)

function mapStateToProps (state) {
  return {
    conversionRate: getConversionRate(state),
    currentCurrency: getConvertedCurrency(state),
  }
}
