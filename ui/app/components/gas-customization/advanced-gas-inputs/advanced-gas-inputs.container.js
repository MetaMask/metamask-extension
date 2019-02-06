import { connect } from 'react-redux'
import { showModal } from '../../../actions'
import AdvancedGasInputs from './advanced-gas-inputs.component'

const mapDispatchToProps = dispatch => {
  return {
    showGasPriceInfoModal: modalName => dispatch(showModal({ name: 'GAS_PRICE_INFO_MODAL' })),
    showGasLimitInfoModal: modalName => dispatch(showModal({ name: 'GAS_LIMIT_INFO_MODAL' })),
  }
}

export default connect(null, mapDispatchToProps)(AdvancedGasInputs)
