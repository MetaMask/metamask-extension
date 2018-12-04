import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Loading from '../../../loading-screen'
import GasPriceChart from '../../gas-price-chart'
import debounce from 'lodash.debounce'

export default class AdvancedTabContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    customGasPrice: PropTypes.number,
    customGasLimit: PropTypes.number,
    gasEstimatesLoading: PropTypes.bool,
    millisecondsRemaining: PropTypes.number,
    totalFee: PropTypes.string,
    timeRemaining: PropTypes.string,
    gasChartProps: PropTypes.object,
    insufficientBalance: PropTypes.bool,
  }

  constructor (props) {
    super(props)

    this.debouncedGasLimitReset = debounce((dVal) => {
      if (dVal < 21000) {
        props.updateCustomGasLimit(21000)
      }
    }, 1000, { trailing: true })
    this.onChangeGasLimit = (val) => {
      props.updateCustomGasLimit(val)
      this.debouncedGasLimitReset(val)
    }
  }

  gasInput (value, onChange, min, insufficientBalance, showGWEI) {
    return (
      <div className="advanced-tab__gas-edit-row__input-wrapper">
        <input
          className={classnames('advanced-tab__gas-edit-row__input', {
            'advanced-tab__gas-edit-row__input--error': insufficientBalance,
          })}
          type="number"
          value={value}
          min={min}
          onChange={event => onChange(Number(event.target.value))}
        />
        <div className={classnames('advanced-tab__gas-edit-row__input-arrows', {
          'advanced-tab__gas-edit-row__input-arrows--error': insufficientBalance,
        })}>
          <div className="advanced-tab__gas-edit-row__input-arrows__i-wrap" onClick={() => onChange(value + 1)}><i className="fa fa-sm fa-angle-up" /></div>
          <div className="advanced-tab__gas-edit-row__input-arrows__i-wrap" onClick={() => onChange(value - 1)}><i className="fa fa-sm fa-angle-down" /></div>
        </div>
        {insufficientBalance && <div className="advanced-tab__gas-edit-row__insufficient-balance">
          Insufficient Balance
        </div>}
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

  renderGasEditRows (customGasPrice, updateCustomGasPrice, customGasLimit, updateCustomGasLimit, insufficientBalance) {
    return (
      <div className="advanced-tab__gas-edit-rows">
        { this.renderGasEditRow('gasPrice', customGasPrice, updateCustomGasPrice, customGasPrice, insufficientBalance, true) }
        { this.renderGasEditRow('gasLimit', customGasLimit, this.onChangeGasLimit, customGasLimit, insufficientBalance) }
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
      insufficientBalance,
      totalFee,
      gasChartProps,
      gasEstimatesLoading,
    } = this.props

    return (
      <div className="advanced-tab">
        { this.renderDataSummary(totalFee, timeRemaining) }
        <div className="advanced-tab__fee-chart">
          { this.renderGasEditRows(
              customGasPrice,
              updateCustomGasPrice,
              customGasLimit,
              updateCustomGasLimit,
              insufficientBalance
          ) }
          <div className="advanced-tab__fee-chart__title">Live Gas Price Predictions</div>
          {!gasEstimatesLoading
            ? <GasPriceChart {...gasChartProps} updateCustomGasPrice={updateCustomGasPrice} />
            : <Loading />
          }
          <div className="advanced-tab__fee-chart__speed-buttons">
            <span>Slower</span>
            <span>Faster</span>
          </div>
        </div>
      </div>
    )
  }
}
