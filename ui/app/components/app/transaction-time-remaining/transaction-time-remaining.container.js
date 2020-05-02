import { connect } from 'react-redux'
import TransactionTimeRemaining from './transaction-time-remaining.component'
import {
  getEstimatedGasPrices,
  getEstimatedGasTimes,
  getTxParams,
} from '../../../selectors'
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

export default connect(mapStateToProps)(TransactionTimeRemaining)

function calcCustomGasPrice (customGasPriceInHex) {
  return Number(hexWEIToDecGWEI(customGasPriceInHex))
}
