import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import R from 'ramda'
import ConfirmTransactionBase from './confirm-transaction-base.component'
import {
  clearConfirmTransaction,
  updateGasAndCalculate,
} from '../../../ducks/confirm-transaction.duck'
import { clearSend, cancelTx, updateAndApproveTx, showModal } from '../../../actions'

const mapStateToProps = (state, props) => {
  const { toAddress: propsToAddress } = props
  const { confirmTransaction, metamask } = state
  const {
    ethTransactionAmount,
    ethTransactionFee,
    ethTransactionTotal,
    fiatTransactionAmount,
    fiatTransactionFee,
    fiatTransactionTotal,
    hexGasTotal,
    tokenData,
    methodData,
    txData,
    tokenProps,
    nonce,
  } = confirmTransaction
  const { txParams = {}, lastGasPrice, id: transactionId } = txData
  const { from: fromAddress, to: txParamsToAddress } = txParams
  const {
    conversionRate,
    identities,
    currentCurrency,
    accounts,
    selectedAddress,
    selectedAddressTxList,
  } = metamask

  const { balance } = accounts[selectedAddress]
  const { name: fromName } = identities[selectedAddress]
  const toAddress = propsToAddress || txParamsToAddress
  const toName = identities[toAddress] && identities[toAddress].name
  const isTxReprice = Boolean(lastGasPrice)

  const transaction = R.find(({ id }) => id === transactionId)(selectedAddressTxList)
  const transactionStatus = transaction ? transaction.status : ''

  return {
    balance,
    fromAddress,
    fromName,
    toAddress,
    toName,
    ethTransactionAmount,
    ethTransactionFee,
    ethTransactionTotal,
    fiatTransactionAmount,
    fiatTransactionFee,
    fiatTransactionTotal,
    hexGasTotal,
    txData,
    tokenData,
    methodData,
    tokenProps,
    isTxReprice,
    currentCurrency,
    conversionRate,
    transactionStatus,
    nonce,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    clearSend: () => dispatch(clearSend()),
    showTransactionConfirmedModal: ({ onHide }) => {
      return dispatch(showModal({ name: 'TRANSACTION_CONFIRMED', onHide }))
    },
    showCustomizeGasModal: ({ txData, onSubmit, validate }) => {
      return dispatch(showModal({ name: 'CONFIRM_CUSTOMIZE_GAS', txData, onSubmit, validate }))
    },
    updateGasAndCalculate: ({ gasLimit, gasPrice }) => {
      return dispatch(updateGasAndCalculate({ gasLimit, gasPrice }))
    },
    cancelTransaction: ({ id }) => dispatch(cancelTx({ id })),
    sendTransaction: txData => dispatch(updateAndApproveTx(txData)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmTransactionBase)
