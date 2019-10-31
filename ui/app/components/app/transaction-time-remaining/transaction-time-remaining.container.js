import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import TransactionTimeRemaining from './transaction-time-remaining.component'
import {
  getTxParams,
} from '../../../selectors/transactions'
import {
  getEstimatedGasPrices,
  getEstimatedGasTimes,
} from '../../../selectors/custom-gas'
import { getRawTimeEstimateData } from '../../../helpers/utils/gas-time-estimates.util'
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util'

const mapStateToProps = (state, ownProps) => {
  const { transaction } = ownProps
  const { gasPrice: currentGasPrice } = getTxParams(state, transaction)
  const customGasPrice = calcCustomGasPrice(currentGasPrice)
  const gasPrices = getEstimatedGasPrices(state)
  const estimatedTimes = getEstimatedGasTimes(state)

  const {
    newTimeEstimate: initialTimeEstimate,
  } = getRawTimeEstimateData(customGasPrice, gasPrices, estimatedTimes)

  const submittedTime = transaction.submittedTime

  return {
    initialTimeEstimate,
    submittedTime,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(TransactionTimeRemaining)

function calcCustomGasPrice (customGasPriceInHex) {
  return Number(hexWEIToDecGWEI(customGasPriceInHex))
}
