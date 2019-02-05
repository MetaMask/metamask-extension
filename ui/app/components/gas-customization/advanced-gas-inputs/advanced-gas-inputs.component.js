import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
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
    insufficientBalance: PropTypes.bool,
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    showGasPriceInfoModal: PropTypes.func,
    showGasLimitInfoModal: PropTypes.func,
  }

  debouncedGasLimitReset = debounce((dVal) => {
    if (dVal < 21000) {
      this.props.updateCustomGasLimit(21000)
    }
  }, 1000, { trailing: true })

  onChangeGasLimit = (val) => {
    this.props.updateCustomGasLimit(val)
    this.debouncedGasLimitReset(val)
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

  gasInput ({ labelKey, value, onChange, insufficientBalance, showGWEI, customPriceIsSafe, isSpeedUp }) {
    const {
      isInError,
      errorText,
      errorType,
    } = this.gasInputError({ labelKey, insufficientBalance, customPriceIsSafe, isSpeedUp, value })

    return (
      <div className="advanced-gas-inputs__gas-edit-row__input-wrapper">
        <input
          className={classnames('advanced-gas-inputs__gas-edit-row__input', {
            'advanced-gas-inputs__gas-edit-row__input--error': isInError && errorType === 'error',
            'advanced-gas-inputs__gas-edit-row__input--warning': isInError && errorType === 'warning',
          })}
          type="number"
          value={value}
          onChange={event => onChange(Number(event.target.value))}
        />
        <div className={classnames('advanced-gas-inputs__gas-edit-row__input-arrows', {
          'advanced-gas-inputs__gas-edit-row__input--error': isInError && errorType === 'error',
          'advanced-gas-inputs__gas-edit-row__input--warning': isInError && errorType === 'warning',
        })}>
          <div className="advanced-gas-inputs__gas-edit-row__input-arrows__i-wrap" onClick={() => onChange(value + 1)}><i className="fa fa-sm fa-angle-up" /></div>
          <div className="advanced-gas-inputs__gas-edit-row__input-arrows__i-wrap" onClick={() => onChange(value - 1)}><i className="fa fa-sm fa-angle-down" /></div>
        </div>
        { isInError
          ? <div className={`advanced-gas-inputs__gas-edit-row__${errorType}-text`}>
              { errorText }
            </div>
          : null }
      </div>
    )
  }

  infoButton (onClick) {
    return <i className="fa fa-info-circle" onClick={onClick} />
  }

  renderGasEditRow (gasInputArgs) {
    return (
      <div className="advanced-gas-inputs__gas-edit-row">
        <div className="advanced-gas-inputs__gas-edit-row__label">
          { this.context.t(gasInputArgs.labelKey) }
          { this.infoButton(() => gasInputArgs.infoOnClick()) }
        </div>
        { this.gasInput(gasInputArgs) }
      </div>
    )
  }

  render () {
    const {
      customGasPrice,
      updateCustomGasPrice,
      customGasLimit,
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      showGasPriceInfoModal,
      showGasLimitInfoModal,
    } = this.props

    return (
      <div className="advanced-gas-inputs__gas-edit-rows">
        { this.renderGasEditRow({
          labelKey: 'gasPrice',
          value: customGasPrice,
          onChange: updateCustomGasPrice,
          insufficientBalance,
          customPriceIsSafe,
          showGWEI: true,
          isSpeedUp,
          infoOnClick: showGasPriceInfoModal,
        }) }
        { this.renderGasEditRow({
          labelKey: 'gasLimit',
          value: customGasLimit,
          onChange: this.onChangeGasLimit,
          insufficientBalance,
          customPriceIsSafe,
          infoOnClick: showGasLimitInfoModal,
        }) }
      </div>
    )
  }
}
