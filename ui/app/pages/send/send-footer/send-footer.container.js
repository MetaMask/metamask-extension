import { connect } from 'react-redux'
import ethUtil from 'ethereumjs-util'
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
} from '../send.selectors'
import { getGasIsLoading } from '../../../selectors/selectors'
import { networkTransactionsSelector } from '../../../selectors/transactions'
import {
  getTxById,
} from '../../../helpers/utils/util'
import {
  isSendFormInError,
} from './send-footer.selectors'
import {
  addressIsNew,
  constructTxParams,
  constructUpdatedTx,
} from './send-footer.utils'
import {
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
} from '../../../selectors/custom-gas'

export default connect(mapStateToProps, mapDispatchToProps)(SendFooter)

function mapStateToProps (state) {

  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state)
  const gasPrice = getGasPrice(state)
  const activeButtonIndex = getDefaultActiveButtonIndex(gasButtonInfo, gasPrice)
  const gasEstimateType = activeButtonIndex >= 0
    ? gasButtonInfo[activeButtonIndex].gasEstimateType
    : 'custom'

  let fromAddress
  const editingTransactionId = getSendEditingTransactionId(state)
  if (editingTransactionId) {
    const transactions = networkTransactionsSelector(state)
    const tx = getTxById(transactions, editingTransactionId)
    fromAddress = tx && tx.txParams && tx.txParams.from
  }

  return {
    amount: getSendAmount(state),
    data: getSendHexData(state),
    editingTransactionId,
    from: getSendFromObject(state, fromAddress),
    gasLimit: getGasLimit(state),
    gasPrice: getGasPrice(state),
    gasTotal: getGasTotal(state),
    inError: isSendFormInError(state),
    selectedToken: getSelectedToken(state),
    to: getSendTo(state),
    toAccounts: getSendToAccounts(state),
    tokenBalance: getTokenBalance(state),
    unapprovedTxs: getUnapprovedTxs(state),
    sendErrors: getSendErrors(state),
    gasEstimateType,
    gasIsLoading: getGasIsLoading(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    clearSend: () => dispatch(clearSend()),
    sign: ({ selectedToken, to, amount, from, gas, gasPrice, data }) => {
      const txParams = constructTxParams({
        amount,
        data,
        from,
        gas,
        gasPrice,
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
