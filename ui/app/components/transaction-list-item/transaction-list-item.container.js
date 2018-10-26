import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import withMethodData from '../../higher-order-components/with-method-data'
import TransactionListItem from './transaction-list-item.component'
import { setSelectedToken, showModal, showSidebar } from '../../actions'
import { hexToDecimal } from '../../helpers/conversions.util'
import { getTokenData } from '../../helpers/transactions.util'
import { formatDate } from '../../util'
import {
  fetchBasicGasEstimates,
  fetchGasEstimates,
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../ducks/gas.duck'

const mapStateToProps = (state, ownProps) => {
  const { transaction: { txParams: { value, nonce, data } = {}, time } = {} } = ownProps

  const tokenData = data && getTokenData(data)
  const nonceAndDate = nonce ? `#${hexToDecimal(nonce)} - ${formatDate(time)}` : formatDate(time)

  return {
    value,
    nonceAndDate,
    tokenData,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    fetchBasicGasEstimates: () => dispatch(fetchBasicGasEstimates()),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    setSelectedToken: tokenAddress => dispatch(setSelectedToken(tokenAddress)),
    retryTransaction: (transaction) => {
      dispatch(setCustomGasPrice(transaction.txParams.gasPrice))
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

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  withMethodData,
)(TransactionListItem)
