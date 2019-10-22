import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionList from './transaction-list.component'
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
  getTxParams,
} from '../../../selectors/transactions'
import { getSelectedAddress, getAssetImages, getFeatureFlags } from '../../../selectors/selectors'
import { selectedTokenSelector } from '../../../selectors/tokens'
import { updateNetworkNonce } from '../../../store/actions'
import { fetchBasicGasAndTimeEstimates, fetchGasEstimates } from '../../../ducks/gas/gas.duck'
import {
  getBasicGasEstimateBlockTime,
  getCustomGasPrice,
  getEstimatedGasPrices,
  getEstimatedGasTimes,
} from '../../../selectors/custom-gas'
import { getRenderableTimeEstimate } from '../../../helpers/utils/gas-time-estimates.util'
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util'

const mapStateToProps = (state, ownProps) => {
  const { selectedAddressTxList } = state.metamask
  const { modalState: { props: modalProps } = {} } = state.appState.modal || {}
  const { transaction = {} } = ownProps
  const { txData = {} } = modalProps || {}
  const selectedTransaction = selectedAddressTxList.find(({ id }) => id === (transaction.id || txData.id))
  const { gasPrice: currentGasPrice } = getTxParams(state, selectedTransaction)
  const customModalGasPriceInHex = getCustomGasPrice(state) || currentGasPrice
  const customGasPrice = calcCustomGasPrice(customModalGasPriceInHex)
  const gasPrices = getEstimatedGasPrices(state)
  const estimatedTimes = getEstimatedGasTimes(state)
  const transactionTimeFeatureActive = getFeatureFlags(state).transactionTime

  return {
    completedTransactions: nonceSortedCompletedTransactionsSelector(state),
    pendingTransactions: nonceSortedPendingTransactionsSelector(state),
    selectedToken: selectedTokenSelector(state),
    selectedAddress: getSelectedAddress(state),
    assetImages: getAssetImages(state),
    blockTime: getBasicGasEstimateBlockTime(state),
    customGasPrice,
    currentTimeEstimate: getRenderableTimeEstimate(customGasPrice, gasPrices, estimatedTimes),
    transactionTimeFeatureActive,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    updateNetworkNonce: address => dispatch(updateNetworkNonce(address)),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimates()),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { selectedAddress, ...restStateProps } = stateProps
  const { updateNetworkNonce, ...restDispatchProps } = dispatchProps

  return {
    ...restStateProps,
    ...restDispatchProps,
    ...ownProps,
    updateNetworkNonce: () => updateNetworkNonce(selectedAddress),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(TransactionList)

function calcCustomGasPrice (customGasPriceInHex) {
  return Number(hexWEIToDecGWEI(customGasPriceInHex))
}
