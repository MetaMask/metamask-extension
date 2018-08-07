import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  MIN_GAS_PRICE_DEC,
  MIN_GAS_LIMIT_DEC,
} from '../../../send/send.constants'
import GasSlider from '../../gas-slider'
import TimeRemaining from './time-remaining'

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
  }

  gasInput (value, onChange, min, precision, showGWEI) {
    return (
      <div className="advanced-tab__gas-edit-row__input-wrapper">
        <input
          className="advanced-tab__gas-edit-row__input"
          type="number"
          value={value}
          onChange={event => onChange(Number(event.target.value))}
        />
        {showGWEI
          ? <span className="advanced-tab__gas-edit-row__gwei-symbol">GWEI</span>
          : null}
      </div>
    )
  }

  infoButton (onClick) {
    return <i className="fa info-circle" onClick={onClick} />
  }

  renderDataSummary (totalFee, millisecondsRemaining) {
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
          <TimeRemaining
            milliseconds={millisecondsRemaining}
          />
        </div>
      </div>
    )
  }

  renderGasEditRows (customGasPrice, updateCustomGasPrice, customGasLimit, updateCustomGasLimit) {
    return (
      <div className="advanced-tab__gas-edit-rows">
        <div className="advanced-tab__gas-edit-row">
          <div className="advanced-tab__gas-edit-row__label">
            { this.context.t('gasPriceNoDenom') }
            { this.infoButton(() => {}) }
          </div>
          { this.gasInput(customGasPrice, updateCustomGasPrice, MIN_GAS_PRICE_DEC, 9, true) }
        </div>
        <div className="advanced-tab__gas-edit-row">
          <div className="advanced-tab__gas-edit-row__label">
            { this.context.t('gasLimit') }
            { this.infoButton(() => {}) }
          </div>
          { this.gasInput(customGasLimit, updateCustomGasLimit, MIN_GAS_LIMIT_DEC, 0) }
        </div>
      </div>
    )
  }

  render () {
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      millisecondsRemaining,
      customGasPrice,
      customGasLimit,
      totalFee,
    } = this.props

    return (
      <div className="advanced-tab">
        { this.renderDataSummary(totalFee, millisecondsRemaining) }
        <div className="advanced-tab__fee-chart-title">
          { this.context.t('feeChartTitle') }
        </div>
        <div className="advanced-tab__fee-chart" />
        <div className="advanced-tab__slider-container">
          <GasSlider
            onChange={value => {
              updateCustomGasPrice(Number(value))
            }}
            lowLabel={'Cheaper'}
            highLabel={'Faster'}
            value={customGasPrice}
            step={0.1}
            max={200}
            min={0}
            coloredStart={{}}
          />
        </div>
        { this.renderGasEditRows(
            customGasPrice,
            updateCustomGasPrice,
            customGasLimit,
            updateCustomGasLimit
        ) }
      </div>
    )
  }
}
