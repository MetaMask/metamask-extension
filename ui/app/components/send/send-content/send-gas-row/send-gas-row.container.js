import { connect } from 'react-redux'
import {
    getConversionRate,
    getCurrentCurrency,
    getGasTotal,
} from '../../send.selectors.js'
import { getGasLoadingError, gasFeeIsInError } from './send-gas-row.selectors.js'
import { showModal } from '../../../../actions'
import SendGasRow from './send-gas-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendGasRow)

function mapStateToProps (state) {
  return {
    conversionRate: getConversionRate(state),
    convertedCurrency: getCurrentCurrency(state),
    gasTotal: getGasTotal(state),
    gasFeeError: gasFeeIsInError(state),
    gasLoadingError: getGasLoadingError(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () => dispatch(showModal({ name: 'CUSTOMIZE_GAS' })),
  }
}
