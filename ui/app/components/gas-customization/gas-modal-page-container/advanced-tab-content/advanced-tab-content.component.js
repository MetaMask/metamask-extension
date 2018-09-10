import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  MIN_GAS_PRICE_DEC,
  MIN_GAS_LIMIT_DEC,
} from '../../../send/send.constants'
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
          min={min}
          precision={precision}
          onChange={event => onChange(Number(event.target.value))}
        />
        {showGWEI
          ? <span className="advanced-tab__gas-edit-row__gwei-symbol">GWEI</span>
          : null}
      </div>
    )
  }

  infoButton (onClick) {
    return <i className="fa fa-info-circle" onClick={onClick} />
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
        { this.renderGasEditRow('gasPriceNoDenom', customGasPrice, updateCustomGasPrice, MIN_GAS_PRICE_DEC, 9, true) }
        { this.renderGasEditRow('gasLimit', customGasLimit, updateCustomGasLimit, MIN_GAS_LIMIT_DEC, 0) }
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
