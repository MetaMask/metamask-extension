import { connect } from 'react-redux'
import SendEther from './send.component'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
const {
  getSelectedAddress,
} = require('../../selectors/selectors')

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
  getSelectedToken,
  getSelectedTokenContract,
  getSelectedTokenToFiatRate,
  getSendAmount,
  getSendEditingTransactionId,
  getSendHexDataFeatureFlagState,
  getSendFromObject,
  getSendTo,
  getSendToNickname,
  getTokenBalance,
  getQrCodeData,
  getSendEnsResolution,
  getSendEnsResolutionError,
} from './send.selectors'
import {
  getAddressBook,
} from '../../selectors/selectors'
import { getTokens } from './send-content/add-recipient/add-recipient.selectors'
import {
  updateSendTo,
  updateSendTokenBalance,
  updateGasData,
  setGasTotal,
  showQrScanner,
  qrCodeDetected,
  updateSendEnsResolution,
  updateSendEnsResolutionError,
} from '../../store/actions'
import {
  resetSendState,
  updateSendErrors,
} from '../../ducks/send/send.duck'
import {
  fetchBasicGasEstimates,
} from '../../ducks/gas/gas.duck'
import {
  calcGasTotal,
} from './send.utils.js'
import {
  isValidENSAddress,
} from '../../helpers/utils/util'

import {
  SEND_ROUTE,
} from '../../helpers/constants/routes'

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SendEther)

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
    showHexData: getSendHexDataFeatureFlagState(state),
    ensResolution: getSendEnsResolution(state),
    ensResolutionError: getSendEnsResolutionError(state),
    to: getSendTo(state),
    toNickname: getSendToNickname(state),
    tokens: getTokens(state),
    tokenBalance: getTokenBalance(state),
    tokenContract: getSelectedTokenContract(state),
    tokenToFiatRate: getSelectedTokenToFiatRate(state),
    qrCodeData: getQrCodeData(state),
    addressBook: getAddressBook(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateAndSetGasLimit: ({
      blockGasLimit,
      editingTransactionId,
      gasLimit,
      gasPrice,
      recentBlocks,
      selectedAddress,
      selectedToken,
      to,
      value,
      data,
    }) => {
      !editingTransactionId
        ? dispatch(updateGasData({ gasPrice, recentBlocks, selectedAddress, selectedToken, blockGasLimit, to, value, data }))
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
    scanQrCode: () => dispatch(showQrScanner(SEND_ROUTE)),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
    updateSendEnsResolution: (ensResolution) => dispatch(updateSendEnsResolution(ensResolution)),
    updateSendEnsResolutionError: (message) => dispatch(updateSendEnsResolutionError(message)),
    updateToNicknameIfNecessary: (to, toNickname, addressBook) => {
      if (isValidENSAddress(toNickname)) {
        const addressBookEntry = addressBook.find(({ address}) => to === address) || {}
        if (!addressBookEntry.name !== toNickname) {
          dispatch(updateSendTo(to, addressBookEntry.name || ''))
        }
      }
    },
  }
}
