import { connect } from 'react-redux'
import SendEther from './send.component'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'

import {
  getAmountConversionRate,
  getBlockGasLimit,
  getConversionRate,
  getCurrentNetwork,
  getStorageLimit,
  getGasLimit,
  getGasPrice,
  getGasTotal,
  getStorageTotal,
  getGasAndCollateralTotal,
  getPrimaryCurrency,
  getRecentBlocks,
  getSelectedToken,
  getSelectedTokenContract,
  getSendAmount,
  getSendEditingTransactionId,
  getSendHexDataFeatureFlagState,
  getSendFromObject,
  getSendTo,
  getSendToNickname,
  getTokenBalance,
  getQrCodeData,
  getSponsorshipInfo,
} from './send.selectors'
import { getTrustedTokenMap, getSelectedAddress, getAddressBook } from '../../selectors/selectors'
import { getTokens } from './send-content/add-recipient/add-recipient.selectors'
import {
  updateSendTo,
  updateSendTokenBalance,
  updateGasAndCollateralData,
  setGasTotal,
  setStorageTotal,
  showQrScanner,
  qrCodeDetected,
  updateSendEnsResolution,
  updateSendEnsResolutionError,
} from '../../store/actions'
import { resetSendState, updateSendErrors } from '../../ducks/send/send.duck'
import { fetchBasicGasEstimates } from '../../ducks/gas/gas.duck'
import { calcGasTotal, calcStorageTotal } from './send.utils.js'
import { isValidDomainName } from '../../helpers/utils/util'
import { toChecksumAddress } from 'cfx-util'

function mapStateToProps (state) {
  const selectedToken = getSelectedToken(state)
  const trustedTokenMap = getTrustedTokenMap(state)
  const isTrustedToken =
        selectedToken && toChecksumAddress(selectedToken.address) in trustedTokenMap

  let sponsorshipInfo = { willUserPayTxFee: true }
  if (isTrustedToken) {
    sponsorshipInfo = getSponsorshipInfo(state)
  }
  const { willUserPayTxFee } = sponsorshipInfo
  const gasTotal = getGasTotal(state)

  return {
    gasTotalCountSponsorshipInfo: willUserPayTxFee ? gasTotal : '0',
    willUserPayTxFee,
    addressBook: getAddressBook(state),
    amount: getSendAmount(state),
    amountConversionRate: getAmountConversionRate(state),
    blockGasLimit: getBlockGasLimit(state),
    conversionRate: getConversionRate(state),
    editingTransactionId: getSendEditingTransactionId(state),
    from: getSendFromObject(state),
    storageLimit: getStorageLimit(state),
    gasLimit: getGasLimit(state),
    gasPrice: getGasPrice(state),
    gasTotal,
    storageTotal: getStorageTotal(state),
    gasAndCollateralTotal: getGasAndCollateralTotal(state),
    network: getCurrentNetwork(state),
    primaryCurrency: getPrimaryCurrency(state),
    qrCodeData: getQrCodeData(state),
    recentBlocks: getRecentBlocks(state),
    selectedAddress: getSelectedAddress(state),
    selectedToken,
    showHexData: getSendHexDataFeatureFlagState(state),
    to: getSendTo(state),
    toNickname: getSendToNickname(state),
    tokens: getTokens(state),
    tokenBalance: getTokenBalance(state),
    tokenContract: getSelectedTokenContract(state),
    trustedTokenMap: state.metamask.trustedTokenMap,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    updateAndSetGasAndStorageLimit: ({
      blockGasLimit,
      editingTransactionId,
      storageLimit,
      gasLimit,
      gasPrice,
      recentBlocks,
      selectedAddress,
      selectedToken,
      to,
      value,
      data,
    }) => {
      if (editingTransactionId) {
        dispatch(setGasTotal(calcGasTotal(gasLimit, gasPrice)))
        dispatch(setStorageTotal(calcStorageTotal(storageLimit)))
      } else {
        if (selectedToken && !to) {
          return
        }
        dispatch(
          updateGasAndCollateralData({
            gasPrice,
            recentBlocks,
            selectedAddress,
            selectedToken,
            blockGasLimit,
            to,
            value,
            data,
          })
        )
      }
    },
    updateSendTokenBalance: ({ selectedToken, tokenContract, address }) => {
      dispatch(
        updateSendTokenBalance({
          selectedToken,
          tokenContract,
          address,
        })
      )
    },
    updateSendErrors: (newError) => dispatch(updateSendErrors(newError)),
    resetSendState: () => dispatch(resetSendState()),
    scanQrCode: () => dispatch(showQrScanner()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    updateSendTo: (to, nickname) => dispatch(updateSendTo(to, nickname)),
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
    updateSendEnsResolution: (ensResolution) =>
      dispatch(updateSendEnsResolution(ensResolution)),
    updateSendEnsResolutionError: (message) =>
      dispatch(updateSendEnsResolutionError(message)),
    updateToNicknameIfNecessary: (to, toNickname, addressBook) => {
      if (isValidDomainName(toNickname)) {
        const addressBookEntry =
          addressBook.find(({ address }) => to === address) || {}
        if (!addressBookEntry.name !== toNickname) {
          dispatch(updateSendTo(to, addressBookEntry.name || ''))
        }
      }
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SendEther)
