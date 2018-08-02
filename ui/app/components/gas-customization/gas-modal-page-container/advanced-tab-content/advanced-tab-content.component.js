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

  render () {
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      millisecondsRemaining,
      customGasPrice,
      customGasLimit,
    } = this.props

    return (
      <div className="advanced-tab">
        <div className="advanced-tab__transaction-data-summary">
          <div className="advanced-tab__transaction-data-summary__titles">
            <span>New Transaction Fee</span>
            <span>~Transaction Time</span>
          </div>
          <div className="advanced-tab__transaction-data-summary__container">
            <div className="advanced-tab__transaction-data-summary__fee">
              $0.30
            </div>
            <TimeRemaining
              milliseconds={millisecondsRemaining}
            />
          </div>
        </div>
        <div className="advanced-tab__fee-chart-title">
          Live Transaction Fee Predictions
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
        <div className="advanced-tab__gas-edit-rows">
          <div className="advanced-tab__gas-edit-row">
            <div className="advanced-tab__gas-edit-row__label">
              Gas Price
              { this.infoButton(() => {}) }
            </div>
            { this.gasInput(customGasPrice, updateCustomGasPrice, MIN_GAS_PRICE_DEC, 9, true) }
          </div>
          <div className="advanced-tab__gas-edit-row">
            <div className="advanced-tab__gas-edit-row__label">
              Gas Limit
              { this.infoButton(() => {}) }
            </div>
            { this.gasInput(customGasLimit, updateCustomGasLimit, MIN_GAS_LIMIT_DEC, 0) }
          </div>
        </div>
      </div>
    )
  }
}
