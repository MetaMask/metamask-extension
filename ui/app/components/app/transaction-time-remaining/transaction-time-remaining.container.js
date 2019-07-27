import { connect } from 'react-redux'
import {
    getEstimatedGasPrices,
    getEstimatedGasTimes,
    getCustomGasPrice,
    formatTimeEstimate,
    getFastPriceEstimateInHexWEI,
} from '../../../selectors/custom-gas'
import TransactionTimeRemaining from '../transaction-time-remaining/transaction-time-remaining.component'
import { getAdjacentGasPrices, extrapolateY } from '../gas-customization/gas-price-chart/gas-price-chart.utils'
import { hexWEIToDecGWEI } from '../../../helpers/utils/conversions.util'
import { getSelectedToken } from '../../../selectors/selectors.js'
import { fetchBasicGasAndTimeEstimates } from '../../../ducks/gas/gas.duck'

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

    return {
        customGasPrice,
        currentTimeEstimate: getRenderableTimeEstimate(customGasPrice, gasPrices, estimatedTimes),
    }
}

const mapDispatchToProps = dispatch => {

    return {
        fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimates()),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(TransactionTimeRemaining)

function getRenderableTimeEstimate (currentGasPrice, gasPrices, estimatedTimes) {
    const minGasPrice = gasPrices[0]
    const maxGasPrice = gasPrices[gasPrices.length - 1]
    let priceForEstimation = currentGasPrice
    if (currentGasPrice < minGasPrice) {
        priceForEstimation = minGasPrice
    } else if (currentGasPrice > maxGasPrice) {
        priceForEstimation = maxGasPrice
    }

    const {
        closestLowerValueIndex,
        closestHigherValueIndex,
        closestHigherValue,
        closestLowerValue,
    } = getAdjacentGasPrices({ gasPrices, priceToPosition: priceForEstimation })

    const newTimeEstimate = extrapolateY({
        higherY: estimatedTimes[closestHigherValueIndex],
        lowerY: estimatedTimes[closestLowerValueIndex],
        higherX: closestHigherValue,
        lowerX: closestLowerValue,
        xForExtrapolation: priceForEstimation,
    })

    return formatTimeEstimate(newTimeEstimate, currentGasPrice > maxGasPrice, currentGasPrice < minGasPrice)
}

function calcCustomGasPrice (customGasPriceInHex) {
    return Number(hexWEIToDecGWEI(customGasPriceInHex))
}

function getTxParams (state, selectedTransaction = {}) {
    const { metamask: { send } } = state
    const { txParams } = selectedTransaction
    return txParams || {
        from: send.from,
        gas: send.gasLimit || '0x5208',
        gasPrice: send.gasPrice || getFastPriceEstimateInHexWEI(state, true),
        to: send.to,
        value: getSelectedToken(state) ? '0x0' : send.amount,
    }
}
