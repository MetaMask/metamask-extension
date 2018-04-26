import { connect } from 'react-redux'
import ethUtil from 'ethereumjs-util' 
import {
  addToAddressBook,
  clearSend,
  goHome,
  signTokenTx,
  signTx,
  updateTransaction,
} from '../../../actions'
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
  getTokenBalance,
  getUnapprovedTxs,
} from '../send.selectors'
import {
  isSendFormInError,
} from './send-footer.selectors'
import {
  addressIsNew,
  formShouldBeDisabled,
  constructTxParams,
} from './send-footer.utils'

export default connect(mapStateToProps, mapDispatchToProps)(SendFooter)

function mapStateToProps (state) {
  return {
    isToken: Boolean(getSelectedToken(state)),
    inError: isSendFormInError(state),
    disabled: formShouldBeDisabled({
      inError: isSendFormInError(state),
      selectedToken: getSelectedToken(state),
      tokenBalance: getTokenBalance(state),
      gasTotal: getGasTotal(state),
    }),
    amount: getSendAmount(state),
    editingTransactionId: getSendEditingTransactionId(state),
    from: getSendFromObject(state),
    gasLimit: getGasLimit(state),
    gasPrice: getGasPrice(state),
    selectedToken: getSelectedToken(state),
    to: getSendTo(state),
    unapprovedTxs: getUnapprovedTxs(state),
    toAccounts: getSendToAccounts(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(goHome()),
    clearSend: () => dispatch(clearSend()),
    sign: ({ selectedToken, to, amount, from, gas, gasPrice }) => {
      const txParams = constructTxParams({
        amount,
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
        editingTransactionId,
        from,
        gas,
        gasPrice,
        selectedToken,
        to,
        unapprovedTxs,
      })

      dispatch(updateTransaction(editingTx))
    },
    addToAddressBookIfNew: (newAddress, toAccounts, nickname = '') => {
      const hexPrefixedAddress = ethUtil.addHexPrefix(newAddress)
      if (addressIsNew(toAccounts)) {
        // TODO: nickname, i.e. addToAddressBook(recipient, nickname)
        dispatch(addToAddressBook(hexPrefixedAddress, nickname))
      }
    }
  }
}
