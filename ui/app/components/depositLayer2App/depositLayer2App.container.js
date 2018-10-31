import { connect } from 'react-redux'
import DepositLayer2App from './depositLayer2App.component'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import {
  getAmountConversionRate,
  getBlockGasLimit,
  getConversionRate,
  getCurrentNetwork,
  getGasLimit,
  getGasPrice,
  getGasTotal,
  getPrimaryCurrency,
  getRecentBlocks,
  getSelectedAddress,
  getSelectedLayer2AppAddress,  
  getSelectedToken,
  getSelectedTokenContract,
  getSelectedTokenToFiatRate,
  getSendAmount,
  getSendEditingTransactionId,
  getSendHexDataFeatureFlagState,
  getSendFromObject,
  getSendTo,
  getTokenBalance,
  getQrCodeData,
} from './send.selectors'
import {
  updateSendTo,
  updateSendTokenBalance,
  updateGasData,
  setGasTotal,
  showQrScanner,
  qrCodeDetected,
} from '../../actions'
import {
  resetSendState,
  updateSendErrors,
} from '../../ducks/send.duck'
import {
  calcGasTotal,
} from './send.utils.js'

import {
  DEPOSIT_LAYER2APP_ROUTE,
} from '../../routes'

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(DepositLayer2App)

function mapStateToProps (state) {
  return {
    amount: getSendAmount(state),
    amountConversionRate: getAmountConversionRate(state),
    blockGasLimit: getBlockGasLimit(state),
    conversionRate: getConversionRate(state),
    editingTransactionId: getSendEditingTransactionId(state),
    from: getSendFromObject(state),
    gasLimit: getGasLimit(state),
    gasPrice: getGasPrice(state),
    gasTotal: getGasTotal(state),
    network: getCurrentNetwork(state),
    primaryCurrency: getPrimaryCurrency(state),
    recentBlocks: getRecentBlocks(state),
    selectedAddress: getSelectedAddress(state),
    selectedToken: getSelectedToken(state),
    selectedLayer2AppAddress: getSelectedLayer2AppAddress(state),    
    showHexData: getSendHexDataFeatureFlagState(state),
    to: getSendTo(state),
    tokenBalance: getTokenBalance(state),
    tokenContract: getSelectedTokenContract(state),
    tokenToFiatRate: getSelectedTokenToFiatRate(state),
    qrCodeData: getQrCodeData(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateAndSetGasTotal: ({
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPrice,
      recentBlocks,
      selectedAddress,
      selectedToken,
      selectedLayer2AppAddress,      
      to,
      value,
      data,
    }) => {
      !editingTransactionId
        ? dispatch(updateGasData({ recentBlocks, selectedAddress, selectedToken, blockGasLimit, to, value, data }))
        : dispatch(setGasTotal(calcGasTotal(gasLimit, gasPrice)))
    },
    updateSendTokenBalance: ({ selectedToken, tokenContract, address }) => {
      dispatch(updateSendTokenBalance({
        selectedToken,
        tokenContract,
        address,
      }))
    },
    updateSendErrors: newError => dispatch(updateSendErrors(newError)),
    resetSendState: () => dispatch(resetSendState()),
    scanQrCode: () => dispatch(showQrScanner(DEPOSIT_LAYER2APP_ROUTE)),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
  }
}
