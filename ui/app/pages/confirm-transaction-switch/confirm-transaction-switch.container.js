import { connect } from 'react-redux'
import ConfirmTransactionSwitch from './confirm-transaction-switch.component'
import {
  TOKEN_METHOD_TRANSFER,
  TOKEN_METHOD_APPROVE,
  TOKEN_METHOD_TRANSFER_FROM,
  SEND_ETHER_ACTION_KEY,
} from '../../helpers/constants/transactions'
import { unconfirmedTransactionsListSelector } from '../../selectors/confirm-transaction'

const mapStateToProps = (state, ownProps) => {
  const { metamask: { unapprovedTxs } } = state
  const { match: { params = {}, url } } = ownProps
  const urlId = url && url.match(/\d+/) && url.match(/\d+/)[0]
  const { id: paramsId } = params
  const transactionId = paramsId || urlId

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state)
  const totalUnconfirmed = unconfirmedTransactions.length
  const transaction = totalUnconfirmed
    ? unapprovedTxs[transactionId] || unconfirmedTransactions[totalUnconfirmed - 1]
    : {}

  return {
    txData: transaction,
    isEtherTransaction: transaction && transaction.transactionCategory === SEND_ETHER_ACTION_KEY,
    isTokenMethod: [TOKEN_METHOD_APPROVE, TOKEN_METHOD_TRANSFER, TOKEN_METHOD_TRANSFER_FROM].includes(transaction && transaction.transactionCategory && transaction.transactionCategory.toLowerCase()),
  }
}

export default connect(mapStateToProps)(ConfirmTransactionSwitch)
