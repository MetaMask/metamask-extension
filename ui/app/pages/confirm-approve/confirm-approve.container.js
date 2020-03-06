import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router-dom'
import {
  contractExchangeRateSelector,
  transactionFeeSelector,
} from '../../selectors/confirm-transaction'
import { showModal } from '../../store/actions'
import { tokenSelector } from '../../selectors/tokens'
import {
  getTokenData,
} from '../../helpers/utils/transactions.util'
import withTokenTracker from '../../helpers/higher-order-components/with-token-tracker'
import {
  calcTokenAmount,
  getTokenToAddress,
  getTokenValue,
} from '../../helpers/utils/token-util'
import ConfirmApprove from './confirm-approve.component'

const mapStateToProps = (state, ownProps) => {
  const { match: { params = {} } } = ownProps
  const { id: paramsTransactionId } = params
  const {
    confirmTransaction,
    metamask: {
      currentCurrency,
      conversionRate,
      currentNetworkTxList,
      domainMetadata = {},
      selectedAddress,
    },
  } = state

  const {
    txData: { id: transactionId, txParams: { to: tokenAddress, data } = {} } = {},
  } = confirmTransaction

  const transaction = (
    currentNetworkTxList.find(({ id }) => id === (Number(paramsTransactionId) ||
    transactionId)) || {}
  )

  const {
    ethTransactionTotal,
    fiatTransactionTotal,
  } = transactionFeeSelector(state, transaction)
  const tokens = tokenSelector(state)
  const currentToken = tokens && tokens.find(({ address }) => tokenAddress === address)
  const { decimals, symbol: tokenSymbol } = currentToken || {}

  const tokenData = getTokenData(data)
  const tokenValue = tokenData && getTokenValue(tokenData.params)
  const toAddress = tokenData && getTokenToAddress(tokenData.params)
  const tokenAmount = tokenData && calcTokenAmount(tokenValue, decimals).toString(10)
  const contractExchangeRate = contractExchangeRateSelector(state)

  const { origin } = transaction
  const formattedOrigin = origin
    ? origin[0].toUpperCase() + origin.slice(1)
    : ''

  const { icon: siteImage = '' } = domainMetadata[origin] || {}
  return {
    toAddress,
    tokenAddress,
    tokenAmount,
    currentCurrency,
    conversionRate,
    contractExchangeRate,
    fiatTransactionTotal,
    ethTransactionTotal,
    tokenSymbol,
    siteImage,
    token: { address: tokenAddress },
    userAddress: selectedAddress,
    origin: formattedOrigin,
    data,
    decimals: Number(decimals),
    txData: transaction,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    showCustomizeGasModal: (txData) => dispatch(showModal({ name: 'CUSTOMIZE_GAS', txData })),
    showEditApprovalPermissionModal: ({
      customTokenAmount,
      decimals,
      origin,
      setCustomAmount,
      tokenAmount,
      tokenBalance,
      tokenSymbol,
    }) => dispatch(showModal({
      name: 'EDIT_APPROVAL_PERMISSION',
      customTokenAmount,
      decimals,
      origin,
      setCustomAmount,
      tokenAmount,
      tokenBalance,
      tokenSymbol,
    })),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  withTokenTracker,
)(ConfirmApprove)

