import React, { Component } from 'react'
import PropTypes from 'prop-types'
import GasPriceChart from '../../gas-price-chart'

export default class AdvancedTabContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    customGasPrice: PropTypes.number,
    customGasLimit: PropTypes.number,
    millisecondsRemaining: PropTypes.number,
    totalFee: PropTypes.string,
    timeRemaining: PropTypes.string,
    gasChartProps: PropTypes.object,
  }

  gasInput (value, onChange, min, precision, showGWEI) {
    return (
      <div className="advanced-tab__gas-edit-row__input-wrapper">
        <input
          className="advanced-tab__gas-edit-row__input"
          type="number"
          value={value}
          min={min}
          precision={precision}
          onChange={event => onChange(Number(event.target.value))}
        />
      </div>
    )
  }

  infoButton (onClick) {
    return <i className="fa fa-info-circle" onClick={onClick} />
  }

  renderDataSummary (totalFee, timeRemaining) {
    return (
      <div className="advanced-tab__transaction-data-summary">
        <div className="advanced-tab__transaction-data-summary__titles">
          <span>{ this.context.t('newTransactionFee') }</span>
          <span>~{ this.context.t('transactionTime') }</span>
        </div>
        <div className="advanced-tab__transaction-data-summary__container">
          <div className="advanced-tab__transaction-data-summary__fee">
            {totalFee}
          </div>
          <div className="time-remaining">{timeRemaining}</div>
        </div>
      </div>
    )
  }

  renderGasEditRow (labelKey, ...gasInputArgs) {
    return (
      <div className="advanced-tab__gas-edit-row">
        <div className="advanced-tab__gas-edit-row__label">
          { this.context.t(labelKey) }
          { this.infoButton(() => {}) }
        </div>
        { this.gasInput(...gasInputArgs) }
      </div>
    )
  }

  renderGasEditRows (customGasPrice, updateCustomGasPrice, customGasLimit, updateCustomGasLimit) {
    return (
      <div className="advanced-tab__gas-edit-rows">
        { this.renderGasEditRow('gasPrice', customGasPrice, updateCustomGasPrice, customGasPrice, 9, true) }
        { this.renderGasEditRow('gasLimit', customGasLimit, updateCustomGasLimit, customGasLimit, 0) }
      </div>
    )
  }

  render () {
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      timeRemaining,
      customGasPrice,
      customGasLimit,
      totalFee,
      gasChartProps,
    } = this.props

    return (
      <div className="advanced-tab">
        { this.renderDataSummary(totalFee, timeRemaining) }
        <div className="advanced-tab__fee-chart">
          { this.renderGasEditRows(
              customGasPrice,
              updateCustomGasPrice,
              customGasLimit,
              updateCustomGasLimit
          ) }
          <div className="advanced-tab__fee-chart__title">Live Gas Price Predictions</div>
          <GasPriceChart {...gasChartProps} updateCustomGasPrice={updateCustomGasPrice} />
          <div className="advanced-tab__fee-chart__speed-buttons">
            <span>Slower</span>
            <span>Faster</span>
          </div>
        </div>
      </div>
    )
  }
}
