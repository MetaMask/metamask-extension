import { connect } from 'react-redux'
import { showModal } from '../../../../store/actions'
import {
  decWEIToHexWEI,
  decimalToHex,
  hexWEIToDecWEI,
  hexWEIToDecEth,
} from '../../../../helpers/utils/conversions.util'
import { calcStorageTotal } from '../../../../pages/send/send.utils.js'
import AdvancedGasInputs from './advanced-gas-inputs.component'

function convertGasPriceForInputs (gasPriceInHexWEI) {
  return Number(hexWEIToDecWEI(gasPriceInHexWEI))
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
    showStorageLimitInfoModal: (storageLimit) =>
      dispatch(
        showModal({
          name: 'STORAGE_LIMIT_INFO_MODAL',
          i18nArgs: [storageLimit],
        })
      ),
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
  const {
    showStorageLimitInfoModal: dispatchShowStorageLimitInfoModal,
  } = dispatchProps
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    showStorageLimitInfoModal: () =>
      dispatchShowStorageLimitInfoModal(
        hexWEIToDecEth(calcStorageTotal(customStorageLimit))
      ),
    customGasPrice: convertGasPriceForInputs(customGasPrice),
    customGasLimit: convertGasOrStorageLimitForInputs(customGasLimit),
    customStorageLimit: convertGasOrStorageLimitForInputs(customStorageLimit),
    updateCustomGasPrice: (price) => updateCustomGasPrice(decWEIToHexWEI(price)),
    updateCustomGasLimit: (limit) => updateCustomGasLimit(decimalToHex(limit)),
    updateCustomStorageLimit: (limit) =>
      updateCustomStorageLimit(decimalToHex(limit)),
  }
}

export default connect(null, mapDispatchToProps, mergeProps)(AdvancedGasInputs)
