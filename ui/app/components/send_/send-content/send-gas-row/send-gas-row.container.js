import { connect } from 'react-redux'
import {
    getConversionRate,
    getConvertedCurrency,
    getGasTotal,
} from '../../send.selectors.js'
import { sendGasIsInError } from './send-gas-row.selectors.js'
import { showModal } from '../../../../actions'
import SendGasRow from './send-gas-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendGasRow)

function mapStateToProps (state) {
  return {
    conversionRate: getConversionRate(state),
    convertedCurrency: getConvertedCurrency(state),
    gasTotal: getGasTotal(state),
    gasLoadingError: sendGasIsInError(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () => dispatch(showModal({ name: 'CUSTOMIZE_GAS' })),
  }
}
