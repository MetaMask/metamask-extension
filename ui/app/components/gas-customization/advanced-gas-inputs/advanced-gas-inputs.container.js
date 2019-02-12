import { connect } from 'react-redux'
import { addHexPrefix } from 'ethereumjs-util'
import { showModal } from '../../../actions'
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from '../../../helpers/conversions.util'
import AdvancedGasInputs from './advanced-gas-inputs.component'

function convertGasPriceForInputs (gasPriceInHexWEI) {
  return Number(hexWEIToDecGWEI(gasPriceInHexWEI))
}

function convertGasLimitForInputs (gasLimitInHexWEI) {
  return parseInt(gasLimitInHexWEI, 16)
}

const mapDispatchToProps = dispatch => {
  return {
    showGasPriceInfoModal: modalName => dispatch(showModal({ name: 'GAS_PRICE_INFO_MODAL' })),
    showGasLimitInfoModal: modalName => dispatch(showModal({ name: 'GAS_LIMIT_INFO_MODAL' })),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {customGasPrice, customGasLimit, updateCustomGasPrice, updateCustomGasLimit} = ownProps
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    customGasPrice: convertGasPriceForInputs(customGasPrice),
    customGasLimit: convertGasLimitForInputs(customGasLimit),
    updateCustomGasPrice: (price) => updateCustomGasPrice(addHexPrefix(decGWEIToHexWEI(price))),
    updateCustomGasLimit: (limit) => updateCustomGasLimit(addHexPrefix(decimalToHex(limit))),
  }
}

export default connect(null, mapDispatchToProps, mergeProps)(AdvancedGasInputs)
