import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionListItem from './transaction-list-item.component'
import { setSelectedToken, showModal, showSidebar, getContractMethodData } from '../../../store/actions'
import { hexToDecimal } from '../../../helpers/utils/conversions.util'
import { getTokenData } from '../../../helpers/utils/transactions.util'
import { getHexGasTotal, increaseLastGasPrice } from '../../../helpers/utils/confirm-tx.util'
import { formatDate } from '../../../helpers/utils/util'
import {
  fetchBasicGasAndTimeEstimates,
  fetchGasEstimates,
  setCustomGasPriceForRetry,
  setCustomGasLimit,
} from '../../../ducks/gas/gas.duck'
import { getIsMainnet, preferencesSelector, getSelectedAddress, conversionRateSelector, getKnownMethodData } from '../../../selectors/selectors'
import { isBalanceSufficient } from '../../../pages/send/send.utils'

const mapStateToProps = (state, ownProps) => {
  const { metamask: { accounts, provider, frequentRpcListDetail } } = state
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const { transactionGroup: { primaryTransaction } = {} } = ownProps
  const { txParams: { gas: gasLimit, gasPrice, data } = {}, transactionCategory } = primaryTransaction
  const selectedAddress = getSelectedAddress(state)
  const selectedAccountBalance = accounts[selectedAddress].balance
  const isDeposit = transactionCategory === 'incoming'
  const selectRpcInfo = frequentRpcListDetail.find(rpcInfo => rpcInfo.rpcUrl === provider.rpcTarget)
  const { rpcPrefs } = selectRpcInfo || {}

  const hasEnoughCancelGas = primaryTransaction.txParams && isBalanceSufficient({
    amount: '0x0',
    gasTotal: getHexGasTotal({
      gasPrice: increaseLastGasPrice(gasPrice),
      gasLimit,
    }),
    balance: selectedAccountBalance,
    conversionRate: conversionRateSelector(state),
  })

  return {
    methodData: getKnownMethodData(state, data) || {},
    showFiat: (isMainnet || !!showFiatInTestnets),
    selectedAccountBalance,
    hasEnoughCancelGas,
    rpcPrefs,
    isDeposit,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimates()),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    setSelectedToken: tokenAddress => dispatch(setSelectedToken(tokenAddress)),
    getContractMethodData: methodData => dispatch(getContractMethodData(methodData)),
    retryTransaction: (transaction, gasPrice) => {
      dispatch(setCustomGasPriceForRetry(gasPrice || transaction.txParams.gasPrice))
      dispatch(setCustomGasLimit(transaction.txParams.gas))
      dispatch(showSidebar({
        transitionName: 'sidebar-left',
        type: 'customize-gas',
        props: { transaction },
      }))
    },
    showCancelModal: (transactionId, originalGasPrice) => {
      return dispatch(showModal({ name: 'CANCEL_TRANSACTION', transactionId, originalGasPrice }))
    },
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { transactionGroup: { primaryTransaction, initialTransaction } = {} } = ownProps
  const { isDeposit } = stateProps
  const { retryTransaction, ...restDispatchProps } = dispatchProps
  const { txParams: { nonce, data } = {}, time = 0 } = initialTransaction
  const { txParams: { value } = {} } = primaryTransaction

  const tokenData = data && getTokenData(data)
  const nonceAndDate = nonce && !isDeposit ? `#${hexToDecimal(nonce)} - ${formatDate(time)}` : formatDate(time)

  return {
    ...stateProps,
    ...restDispatchProps,
    ...ownProps,
    value,
    nonceAndDate,
    tokenData,
    transaction: initialTransaction,
    primaryTransaction,
    retryTransaction: (transactionId, gasPrice) => {
      const { transactionGroup: { transactions = [] } } = ownProps
      const transaction = transactions.find(tx => tx.id === transactionId) || {}
      const increasedGasPrice = increaseLastGasPrice(gasPrice)
      retryTransaction(transaction, increasedGasPrice)
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(TransactionListItem)
