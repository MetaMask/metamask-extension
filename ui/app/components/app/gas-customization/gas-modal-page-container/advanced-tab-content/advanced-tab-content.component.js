import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  decGWEIToHexWEI,
} from '../../../../../helpers/utils/conversions.util'
import Loading from '../../../../ui/loading-screen'
import GasPriceChart from '../../gas-price-chart'
import AdvancedGasInputs from '../../advanced-gas-inputs'

export default class AdvancedTabContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    customModalGasPriceInHex: PropTypes.string,
    customModalGasLimitInHex: PropTypes.string,
    gasEstimatesLoading: PropTypes.bool,
    millisecondsRemaining: PropTypes.number,
    transactionFee: PropTypes.string,
    timeRemaining: PropTypes.string,
    gasChartProps: PropTypes.object,
    insufficientBalance: PropTypes.bool,
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    isEthereumNetwork: PropTypes.bool,
    customGasLimitMessage: PropTypes.string,
    minimumGasLimit: PropTypes.number,
  }

  renderDataSummary (transactionFee, timeRemaining) {
    return (
      <div className="advanced-tab__transaction-data-summary">
        <div className="advanced-tab__transaction-data-summary__titles">
          <span>{ this.context.t('newTransactionFee') }</span>
          <span>~{ this.context.t('transactionTime') }</span>
        </div>
        <div className="advanced-tab__transaction-data-summary__container">
          <div className="advanced-tab__transaction-data-summary__fee">
            {transactionFee}
          </div>
          <div className="advanced-tab__transaction-data-summary__time-remaining">{timeRemaining}</div>
        </div>
      </div>
    )
  }

  onGasChartUpdate = (price) => {
    const { updateCustomGasPrice } = this.props
    updateCustomGasPrice(decGWEIToHexWEI(price))
  }

  render () {
    const { t } = this.context
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      timeRemaining,
      customModalGasPriceInHex,
      customModalGasLimitInHex,
      insufficientBalance,
      gasChartProps,
      gasEstimatesLoading,
      customPriceIsSafe,
      isSpeedUp,
      transactionFee,
      isEthereumNetwork,
      customGasLimitMessage,
      minimumGasLimit,
    } = this.props

    return (
      <div className="advanced-tab">
        { this.renderDataSummary(transactionFee, timeRemaining) }
        <div className="advanced-tab__fee-chart">
          <div className="advanced-tab__gas-inputs">
            <AdvancedGasInputs
              updateCustomGasPrice={updateCustomGasPrice}
              updateCustomGasLimit={updateCustomGasLimit}
              customGasPrice={customModalGasPriceInHex}
              customGasLimit={customModalGasLimitInHex}
              insufficientBalance={insufficientBalance}
              customPriceIsSafe={customPriceIsSafe}
              isSpeedUp={isSpeedUp}
              customGasLimitMessage={customGasLimitMessage}
              minimumGasLimit={minimumGasLimit}
            />
          </div>
          { isEthereumNetwork
            ? (
              <div>
                <div className="advanced-tab__fee-chart__title">{ t('liveGasPricePredictions') }</div>
                {gasEstimatesLoading
                  ? <Loading />
                  : <GasPriceChart {...gasChartProps} updateCustomGasPrice={this.onGasChartUpdate} />
                }
                <div className="advanced-tab__fee-chart__speed-buttons">
                  <span>{ t('slower') }</span>
                  <span>{ t('faster') }</span>
                </div>
              </div>
            )
            : <div className="advanced-tab__fee-chart__title">{ t('chartOnlyAvailableEth') }</div>
          }
        </div>
      </div>
    )
  }
}
