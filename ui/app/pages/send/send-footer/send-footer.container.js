import { connect } from 'react-redux'
import * as ethUtil from 'cfx-util'
import {
  addToAddressBook,
  clearSend,
  signTokenTx,
  signTx,
  updateTransaction,
} from '../../../store/actions'
import SendFooter from './send-footer.component'
import {
  getGasLimit,
  getStorageLimit,
  getGasPrice,
  getGasTotal,
  getSelectedToken,
  getSendAmount,
  getSendEditingTransactionId,
  getSendFromObject,
  getSendTo,
  getSendToAccounts,
  getSendHexData,
  getTokenBalance,
  getUnapprovedTxs,
  getSendErrors,
  getSponsorshipInfo,
  getConversionRate,
} from '../send.selectors'
import {
  getGasIsLoading,
  getStorageIsLoading,
  getSponsorshipInfoIsLoading,
  getCurrentEthBalance,
} from '../../../selectors/selectors'
import { isSendFormInError } from './send-footer.selectors'
import {
  addressIsNew,
  constructTxParams,
  constructUpdatedTx,
} from './send-footer.utils'
import { isBalanceSufficient, calcGasAndCollateralTotal } from '../send.utils'
import {
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
} from '../../../selectors/custom-gas'

export default connect(mapStateToProps, mapDispatchToProps)(SendFooter)

function mapStateToProps (state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state)
  const gasPrice = getGasPrice(state)
  const gasLimit = getGasLimit(state)
  const storageLimit = getStorageLimit(state)

  const conversionRate = getConversionRate(state)
  const balance = getCurrentEthBalance(state)
  const activeButtonIndex = getDefaultActiveButtonIndex(gasButtonInfo, gasPrice)
  const gasEstimateType =
    activeButtonIndex >= 0
      ? gasButtonInfo[activeButtonIndex].gasEstimateType
      : 'custom'

  const amount = getSendAmount(state)
  const selectedToken = getSelectedToken(state)
  const sponsorshipInfo = getSponsorshipInfo(state) || {
    willUserPayTxFee: true,
  }
  const { willUserPayTxFee, willUserPayCollateral } = sponsorshipInfo

  const insufficientBalance = !isBalanceSufficient({
    amount: selectedToken ? '0x0' : amount,
    gasTotal: calcGasAndCollateralTotal(
      willUserPayTxFee ? gasLimit : '0',
      willUserPayTxFee ? gasPrice : '0',
      willUserPayCollateral ? storageLimit : '0'
    ),
    balance,
    conversionRate,
  })

  return {
    insufficientBalance,
    amount,
    data: getSendHexData(state),
    editingTransactionId: getSendEditingTransactionId(state),
    from: getSendFromObject(state),
    gasLimit,
    storageLimit,
    gasPrice,
    gasTotal: getGasTotal(state),
    inError: isSendFormInError(state),
    selectedToken,
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    tokenBalance: getTokenBalance(state),
    unapprovedTxs: getUnapprovedTxs(state),
    sendErrors: getSendErrors(state),
    gasEstimateType,
    gasIsLoading: getGasIsLoading(state),
    storageIsLoading: getStorageIsLoading(state),
    sponsorshipIsLoading: getSponsorshipInfoIsLoading(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
    sign: ({
      selectedToken,
      to,
      amount,
      from,
      gas,
      gasPrice,
      storageLimit,
      data,
    }) => {
      const txParams = constructTxParams({
        amount,
        data,
        from,
        gas,
        gasPrice,
        storageLimit,
        selectedToken,
        to,
      })

      selectedToken
        ? dispatch(signTokenTx(selectedToken.address, to, amount, txParams))
        : dispatch(signTx(txParams))
    },
    update: ({
      amount,
      data,
      editingTransactionId,
      from,
      gas,
      gasPrice,
      storageLimit,
      selectedToken,
      to,
      unapprovedTxs,
    }) => {
      const editingTx = constructUpdatedTx({
        amount,
        data,
        editingTransactionId,
        from,
        gas,
        gasPrice,
        storageLimit,
        selectedToken,
        to,
        unapprovedTxs,
      })

      return dispatch(updateTransaction(editingTx))
    },

    addToAddressBookIfNew: (newAddress, toAccounts, nickname = '') => {
      const hexPrefixedAddress = ethUtil.addHexPrefix(newAddress)
      if (addressIsNew(toAccounts, hexPrefixedAddress)) {
        // TODO: nickname, i.e. addToAddressBook(recipient, nickname)
        dispatch(addToAddressBook(hexPrefixedAddress, nickname))
      }
    },
  }
}
