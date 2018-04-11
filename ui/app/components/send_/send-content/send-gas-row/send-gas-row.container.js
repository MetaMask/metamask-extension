import {
    getConversionRate,
    getConvertedCurrency,
    getGasTotal,
} from '../../send.selectors.js'
import { getGasLoadingError } from './send-gas-row.selectors.js'
import { calcTokenUpdateAmount } from './send-gas-row.utils.js'
import { showModal } from '../../../actions'
import SendGasRow from './send-from-row.component'

export default connect(mapStateToProps, mapDispatchToProps)(SendGasRow)

function mapStateToProps (state) {
  return {
    conversionRate: getConversionRate(state),
    convertedCurrency: getConvertedCurrency(state),
    gasTotal: getGasTotal(state),
    gasLoadingError: getGasLoadingError(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () => dispatch(showModal({ name: 'CUSTOMIZE_GAS' })),
  }
}
