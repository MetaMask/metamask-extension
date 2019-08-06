import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Loading from '../../../../ui/loading-screen'
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
    transactionFee: PropTypes.string,
    timeRemaining: PropTypes.string,
    gasChartProps: PropTypes.object,
    insufficientBalance: PropTypes.bool,
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    isEthereumNetwork: PropTypes.bool,
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

  gasInputError ({ labelKey, insufficientBalance, customPriceIsSafe, isSpeedUp, value }) {
    const { t } = this.context
    let errorText
    let errorType
    let isInError = true


    if (insufficientBalance) {
      errorText = t('insufficientBalance')
      errorType = 'error'
    } else if (labelKey === 'gasPrice' && isSpeedUp && value === 0) {
      errorText = t('zeroGasPriceOnSpeedUpError')
      errorType = 'error'
    } else if (labelKey === 'gasPrice' && !customPriceIsSafe) {
      errorText = t('gasPriceExtremelyLow')
      errorType = 'warning'
    } else {
      isInError = false
    }

    return {
      isInError,
      errorText,
      errorType,
    }
  }

  gasInput ({ labelKey, value, onChange, insufficientBalance, customPriceIsSafe, isSpeedUp }) {
    const {
      isInError,
      errorText,
      errorType,
    } = this.gasInputError({ labelKey, insufficientBalance, customPriceIsSafe, isSpeedUp, value })

    return (
      <div className="advanced-tab__gas-edit-row__input-wrapper">
        <input
          className={classnames('advanced-tab__gas-edit-row__input', {
            'advanced-tab__gas-edit-row__input--error': isInError && errorType === 'error',
            'advanced-tab__gas-edit-row__input--warning': isInError && errorType === 'warning',
          })}
          type="number"
          value={value}
          onChange={event => onChange(Number(event.target.value))}
        />
        <div className={classnames('advanced-tab__gas-edit-row__input-arrows', {
          'advanced-tab__gas-edit-row__input--error': isInError && errorType === 'error',
          'advanced-tab__gas-edit-row__input--warning': isInError && errorType === 'warning',
        })}>
          <div
            className="advanced-tab__gas-edit-row__input-arrows__i-wrap"
            onClick={() => onChange(value + 1)}
          >
            <i className="fa fa-sm fa-angle-up" />
          </div>
          <div
            className="advanced-tab__gas-edit-row__input-arrows__i-wrap"
            onClick={() => onChange(Math.max(value - 1, 0))}
          >
            <i className="fa fa-sm fa-angle-down" />
          </div>
        </div>
        { isInError
          ? <div className={`advanced-tab__gas-edit-row__${errorType}-text`}>
            { errorText }
          </div>
          : null }
      </div>
    )
  }

  infoButton (onClick) {
    return <i className="fa fa-info-circle" onClick={onClick} />
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

  renderGasEditRow (gasInputArgs) {
    return (
      <div className="advanced-tab__gas-edit-row">
        <div className="advanced-tab__gas-edit-row__label">
          { this.context.t(gasInputArgs.labelKey) }
          { this.infoButton(() => {}) }
        </div>
        { this.gasInput(gasInputArgs) }
      </div>
    )
  }

  renderGasEditRows ({
    customGasPrice,
    updateCustomGasPrice,
    customGasLimit,
    insufficientBalance,
    customPriceIsSafe,
    isSpeedUp,
  }) {
    return (
      <div className="advanced-tab__gas-edit-rows">
        { this.renderGasEditRow({
          labelKey: 'gasPrice',
          value: customGasPrice,
          onChange: updateCustomGasPrice,
          insufficientBalance,
          customPriceIsSafe,
          showGWEI: true,
          isSpeedUp,
        }) }
        { this.renderGasEditRow({
          labelKey: 'gasLimit',
          value: customGasLimit,
          onChange: this.onChangeGasLimit,
          insufficientBalance,
          customPriceIsSafe,
        }) }
      </div>
    )
  }

  render () {
    const { t } = this.context
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      timeRemaining,
      customGasPrice,
      customGasLimit,
      insufficientBalance,
      gasChartProps,
      gasEstimatesLoading,
      customPriceIsSafe,
      isSpeedUp,
      transactionFee,
      isEthereumNetwork,
    } = this.props

    return (
      <div className="advanced-tab">
        { this.renderDataSummary(transactionFee, timeRemaining) }
        <div className="advanced-tab__fee-chart">
          { this.renderGasEditRows({
            customGasPrice,
            updateCustomGasPrice,
            customGasLimit,
            updateCustomGasLimit,
            insufficientBalance,
            customPriceIsSafe,
            isSpeedUp,
          }) }
          { isEthereumNetwork
            ? <div>
              <div className="advanced-tab__fee-chart__title">{ t('liveGasPricePredictions') }</div>
              {!gasEstimatesLoading
                ? <GasPriceChart {...gasChartProps} updateCustomGasPrice={updateCustomGasPrice} />
                : <Loading />
              }
              <div className="advanced-tab__fee-chart__speed-buttons">
                <span>{ t('slower') }</span>
                <span>{ t('faster') }</span>
              </div>
            </div>
            : <div className="advanced-tab__fee-chart__title">{ t('chartOnlyAvailableEth') }</div>
          }
        </div>
      </div>
    )
  }
}
