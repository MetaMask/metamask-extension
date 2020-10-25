import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { debounce } from 'lodash'

export default class AdvancedGasInputs extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    updateCustomStorageLimit: PropTypes.func,
    customGasPrice: PropTypes.number.isRequired,
    customGasLimit: PropTypes.number.isRequired,
    customStorageLimit: PropTypes.number.isRequired,
    insufficientBalance: PropTypes.bool,
    customPriceIsSafe: PropTypes.bool,
    isSimpleTx: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    showGasPriceInfoModal: PropTypes.func,
    showGasLimitInfoModal: PropTypes.func,
    showStorageLimitInfoModal: PropTypes.func,
    showInputType: PropTypes.oneOf(['fee', 'collateral', 'all']),
  }

  state = {
    focused: false,
  }

  constructor (props) {
    super(props)
    this.state = {
      gasPrice: this.props.customGasPrice,
      gasLimit: this.props.customGasLimit,
      storageLimit: this.props.customStorageLimit,
    }
    this.changeGasPrice = debounce(this.changeGasPrice, 500)
    this.changeGasLimit = debounce(this.changeGasLimit, 500)
    this.changeStorageLimit = debounce(this.changeStorageLimit, 500)
  }

  componentDidUpdate (prevProps) {
    const {
      customGasPrice: prevCustomGasPrice,
      customGasLimit: prevCustomGasLimit,
      customStorageLimit: prevCustomStorageLimit,
    } = prevProps
    const { customGasPrice, customGasLimit, customStorageLimit } = this.props
    const { gasPrice, gasLimit, storageLimit } = this.state

    if (customGasPrice !== prevCustomGasPrice && customGasPrice !== gasPrice) {
      this.setState({ gasPrice: customGasPrice })
    }
    if (customGasLimit !== prevCustomGasLimit && customGasLimit !== gasLimit) {
      this.setState({ gasLimit: customGasLimit })
    }
    if (
      customStorageLimit !== prevCustomStorageLimit &&
      customStorageLimit !== storageLimit
    ) {
      this.setState({ storageLimit: customStorageLimit })
    }
  }

  onChangeStorageLimit = (e) => {
    if (typeof e.target.value === 'string' && e.target.value.startsWith('-')) {
      e.target.value = e.target.value.slice(1)
    }
    this.setState({ storageLimit: e.target.value })
    this.changeStorageLimit({ target: { value: e.target.value } })
  }

  changeStorageLimit = (e) => {
    const { insufficientBalance } = this.props
    const { errorType } = this.storageLimitError({
      insufficientBalance,
    })
    if (errorType !== 'error') {
      this.props.updateCustomStorageLimit(Number(e.target.value))
    }
  }

  onChangeGasLimit = (e) => {
    if (typeof e.target.value === 'string' && e.target.value.startsWith('-')) {
      e.target.value = e.target.value.slice(1)
    }
    this.setState({ gasLimit: e.target.value })
    this.changeGasLimit({ target: { value: e.target.value } })
  }

  changeGasLimit = (e) => {
    const { insufficientBalance } = this.props
    const { gasLimit } = this.state
    const { errorType } = this.gasLimitError({
      insufficientBalance,
      gasLimit,
    })

    if (errorType !== 'error') {
      this.props.updateCustomGasLimit(Number(e.target.value))
    }
  }

  onChangeGasPrice = (e) => {
    if (typeof e.target.value === 'string' && e.target.value.startsWith('-')) {
      e.target.value = e.target.value.slice(1)
    }
    this.setState({ gasPrice: e.target.value })
    this.changeGasPrice({ target: { value: e.target.value } })
  }

  changeGasPrice = (e) => {
    const { insufficientBalance, customPriceIsSafe, isSpeedUp } = this.props
    const { gasPrice } = this.state

    const { errorType } = this.gasPriceError({
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      gasPrice,
    })
    if (errorType !== 'error') {
      this.props.updateCustomGasPrice(Number(e.target.value))
    }
  }

  gasPriceError ({
    insufficientBalance,
    customPriceIsSafe,
    isSpeedUp,
    gasPrice,
  }) {
    const { t } = this.context

    if (insufficientBalance) {
      return {
        errorText: t('insufficientBalance'),
        errorType: 'error',
      }
    } else if (isSpeedUp && gasPrice === 0) {
      return {
        errorText: t('zeroGasPriceOnSpeedUpError'),
        errorType: 'error',
      }
    } else if (!customPriceIsSafe) {
      return {
        errorText: t('gasPriceExtremelyLow'),
        errorType: 'warning',
      }
    }

    return {}
  }

  gasLimitError ({ insufficientBalance, gasLimit }) {
    const { t } = this.context

    if (insufficientBalance) {
      return {
        errorText: t('insufficientBalance'),
        errorType: 'error',
      }
    } else if (gasLimit < 21000) {
      return {
        errorText: t('gasLimitTooLow'),
        errorType: 'error',
      }
    }

    return {}
  }

  storageLimitError ({ insufficientBalance }) {
    const { t } = this.context

    if (insufficientBalance) {
      return {
        errorText: t('insufficientBalance'),
        errorType: 'error',
      }
    }

    return {}
  }

  renderGasOrStorageInput ({
    value,
    onChange,
    errorComponent,
    errorType,
    infoOnClick,
    label,
  }) {
    const { focused } = this.state
    return (
      <div className="advanced-gas-inputs__gas-edit-row">
        <div className="advanced-gas-inputs__gas-edit-row__label">
          {label}
          <i className="fa fa-info-circle" onClick={infoOnClick} />
        </div>
        <div className="advanced-gas-inputs__gas-edit-row__input-wrapper">
          <input
            onFocus={() => this.setState({ focused: true })}
            onBlur={() => this.setState({ focused: false })}
            className={classnames('advanced-gas-inputs__gas-edit-row__input', {
              'advanced-gas-inputs__gas-edit-row__input--error':
                errorType === 'error',
              'advanced-gas-inputs__gas-edit-row__input--warning':
                errorType === 'warning',
            })}
            type="number"
            value={focused && (value === 0 || value === '') ? '' : value}
            onChange={onChange}
          />
          <div
            className={classnames(
              'advanced-gas-inputs__gas-edit-row__input-arrows',
              {
                'advanced-gas-inputs__gas-edit-row__input--error':
                  errorType === 'error',
                'advanced-gas-inputs__gas-edit-row__input--warning':
                  errorType === 'warning',
              }
            )}
          >
            <div
              className="advanced-gas-inputs__gas-edit-row__input-arrows__i-wrap"
              onClick={() => onChange({ target: { value: value + 1 } })}
            >
              <i className="fa fa-sm fa-angle-up" />
            </div>
            <div
              className="advanced-gas-inputs__gas-edit-row__input-arrows__i-wrap"
              onClick={() =>
                onChange({ target: { value: Math.max(value - 1, 0) } })
              }
            >
              <i className="fa fa-sm fa-angle-down" />
            </div>
          </div>
          {errorComponent}
        </div>
      </div>
    )
  }

  render () {
    const {
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      isSimpleTx,
      showGasPriceInfoModal,
      showGasLimitInfoModal,
      showStorageLimitInfoModal,
      showInputType = 'all',
    } = this.props
    const showFee = showInputType === 'all' || showInputType === 'fee'
    const showCollateral =
      (showInputType === 'all' || showInputType === 'collateral') && !isSimpleTx

    const { gasPrice, gasLimit } = this.state

    const {
      errorText: gasPriceErrorText,
      errorType: gasPriceErrorType,
    } = this.gasPriceError({
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      gasPrice,
    })
    const gasPriceErrorComponent = gasPriceErrorType ? (
      <div
        className={`advanced-gas-inputs__gas-edit-row__${gasPriceErrorType}-text`}
      >
        {gasPriceErrorText}
      </div>
    ) : null

    const {
      errorText: gasLimitErrorText,
      errorType: gasLimitErrorType,
    } = this.gasLimitError({ insufficientBalance, gasLimit })
    const gasLimitErrorComponent = gasLimitErrorType ? (
      <div
        className={`advanced-gas-inputs__gas-edit-row__${gasLimitErrorType}-text`}
      >
        {gasLimitErrorText}
      </div>
    ) : null

    const {
      errorText: storageLimitErrorText,
      errorType: storageLimitErrorType,
    } = this.storageLimitError({ insufficientBalance })
    const storageLimitErrorComponent = storageLimitErrorType ? (
      <div
        className={`advanced-gas-inputs__gas-edit-row__${storageLimitErrorType}-text`}
      >
        {storageLimitErrorText}
      </div>
    ) : null

    return (
      <div className="advanced-gas-inputs__gas-edit-rows">
        {showFee &&
          this.renderGasOrStorageInput({
            label: this.context.t('gasPrice'),
            value: this.state.gasPrice,
            onChange: this.onChangeGasPrice,
            errorComponent: gasPriceErrorComponent,
            errorType: gasPriceErrorType,
            infoOnClick: showGasPriceInfoModal,
          })}
        {showFee &&
          this.renderGasOrStorageInput({
            label: this.context.t('gasLimit'),
            value: this.state.gasLimit,
            onChange: this.onChangeGasLimit,
            errorComponent: gasLimitErrorComponent,
            errorType: gasLimitErrorType,
            infoOnClick: showGasLimitInfoModal,
          })}
        {showCollateral &&
          this.renderGasOrStorageInput({
            label: this.context.t('storageLimit'),
            value: this.state.storageLimit,
            onChange: this.onChangeStorageLimit,
            errorComponent: storageLimitErrorComponent,
            errorType: storageLimitErrorType,
            infoOnClick: showStorageLimitInfoModal,
          })}
      </div>
    )
  }
}
