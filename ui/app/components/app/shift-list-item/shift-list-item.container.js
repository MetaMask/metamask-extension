import {connect} from 'react-redux'
import ShiftListItem from './shift-list-item.component'

function mapStateToProps (state) {
  return {
    selectedAddress: state.metamask.selectedAddress,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
  }
}

export default connect(mapStateToProps)(ShiftListItem)
