import { connect } from 'react-redux'
import { showModal } from '../../../../store/actions'
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util'
import AdvancedGasInputs from './advanced-gas-inputs.component'

function convertGasPriceForInputs (gasPriceInHexWEI) {
  return Number(hexWEIToDecGWEI(gasPriceInHexWEI))
}

function convertGasOrStorageLimitForInputs (gasLimitInHexWEI) {
  return parseInt(gasLimitInHexWEI, 16) || 0
}

const mapDispatchToProps = (dispatch) => {
  return {
    showGasPriceInfoModal: () =>
      dispatch(showModal({ name: 'GAS_PRICE_INFO_MODAL' })),
    showGasLimitInfoModal: () =>
      dispatch(showModal({ name: 'GAS_LIMIT_INFO_MODAL' })),
    showStorageLimitInfoModal: () =>
      dispatch(showModal({ name: 'STORAGE_LIMIT_INFO_MODAL' })),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    customGasPrice,
    customGasLimit,
    customStorageLimit,
    updateCustomGasPrice,
    updateCustomGasLimit,
    updateCustomStorageLimit,
  } = ownProps
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    customGasPrice: convertGasPriceForInputs(customGasPrice),
    customGasLimit: convertGasOrStorageLimitForInputs(customGasLimit),
    customStorageLimit: convertGasOrStorageLimitForInputs(customStorageLimit),
    updateCustomGasPrice: (price) => updateCustomGasPrice(decGWEIToHexWEI(price)),
    updateCustomGasLimit: (limit) => updateCustomGasLimit(decimalToHex(limit)),
    updateCustomStorageLimit: (limit) => updateCustomStorageLimit(decimalToHex(limit)),
  }
}

export default connect(null, mapDispatchToProps, mergeProps)(AdvancedGasInputs)
