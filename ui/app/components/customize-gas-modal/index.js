const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const GasModalCard = require('./gas-modal-card')

const ethUtil = require('ethereumjs-util')

import {
  updateSendErrors,
} from '../../ducks/send.duck'

const {
  MIN_GAS_PRICE_DEC,
  MIN_GAS_LIMIT_DEC,
  MIN_GAS_PRICE_GWEI,
} = require('../send_/send.constants')

const {
  isBalanceSufficient,
} = require('../send_/send.utils')

const {
  conversionUtil,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionMax,
  subtractCurrencies,
} = require('../../conversion-util')

const {
  getGasPrice,
  getGasLimit,
  getForceGasMin,
  conversionRateSelector,
  getSendAmount,
  getSelectedToken,
  getSendFrom,
  getCurrentAccountWithSendEtherInfo,
  getSelectedTokenToFiatRate,
  getSendMaxModeState,
} = require('../../selectors')

function mapStateToProps (state) {
  const selectedToken = getSelectedToken(state)
  const currentAccount = getSendFrom(state) || getCurrentAccountWithSendEtherInfo(state)
  const conversionRate = conversionRateSelector(state)

  return {
    gasPrice: getGasPrice(state),
    gasLimit: getGasLimit(state),
    forceGasMin: getForceGasMin(state),
    conversionRate,
    amount: getSendAmount(state),
    maxModeOn: getSendMaxModeState(state),
    balance: currentAccount.balance,
    primaryCurrency: selectedToken && selectedToken.symbol,
    selectedToken,
    amountConversionRate: selectedToken ? getSelectedTokenToFiatRate(state) : conversionRate,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => dispatch(actions.hideModal()),
    updateGasPrice: newGasPrice => dispatch(actions.updateGasPrice(newGasPrice)),
    updateGasLimit: newGasLimit => dispatch(actions.updateGasLimit(newGasLimit)),
    updateGasTotal: newGasTotal => dispatch(actions.setGasTotal(newGasTotal)),
    updateSendAmount: newAmount => dispatch(actions.updateSendAmount(newAmount)),
    updateSendErrors: error => dispatch(updateSendErrors(error)),
  }
}

function getOriginalState (props) {
  const gasPrice = props.gasPrice || MIN_GAS_PRICE_DEC
  const gasLimit = props.gasLimit || MIN_GAS_LIMIT_DEC

  const gasTotal = multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  })

  return {
    gasPrice,
    gasLimit,
    gasTotal,
    error: null,
    priceSigZeros: '',
    priceSigDec: '',
  }
}

inherits(CustomizeGasModal, Component)
function CustomizeGasModal (props) {
  Component.call(this)

  this.state = getOriginalState(props)
}

CustomizeGasModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(CustomizeGasModal)


CustomizeGasModal.prototype.save = function (gasPrice, gasLimit, gasTotal) {
  const {
    updateGasPrice,
    updateGasLimit,
    hideModal,
    updateGasTotal,
    maxModeOn,
    selectedToken,
    balance,
    updateSendAmount,
    updateSendErrors,
  } = this.props

  if (maxModeOn && !selectedToken) {
    const maxAmount = subtractCurrencies(
      ethUtil.addHexPrefix(balance),
      ethUtil.addHexPrefix(gasTotal),
      { toNumericBase: 'hex' }
    )
    updateSendAmount(maxAmount)
  }

  updateGasPrice(ethUtil.addHexPrefix(gasPrice))
  updateGasLimit(ethUtil.addHexPrefix(gasLimit))
  updateGasTotal(ethUtil.addHexPrefix(gasTotal))
  updateSendErrors({ insufficientFunds: false })
  hideModal()
}

CustomizeGasModal.prototype.revert = function () {
  this.setState(getOriginalState(this.props))
}

CustomizeGasModal.prototype.validate = function ({ gasTotal, gasLimit }) {
  const {
    amount,
    balance,
    selectedToken,
    amountConversionRate,
    conversionRate,
    maxModeOn,
  } = this.props

  let error = null

  const balanceIsSufficient = isBalanceSufficient({
    amount: selectedToken || maxModeOn ? '0' : amount,
    gasTotal,
    balance,
    selectedToken,
    amountConversionRate,
    conversionRate,
  })

  if (!balanceIsSufficient) {
    error = this.context.t('balanceIsInsufficientGas')
  }

  const gasLimitTooLow = gasLimit && conversionGreaterThan(
    {
      value: MIN_GAS_LIMIT_DEC,
      fromNumericBase: 'dec',
      conversionRate,
    },
    {
      value: gasLimit,
      fromNumericBase: 'hex',
    },
  )

  if (gasLimitTooLow) {
    error = this.context.t('gasLimitTooLow')
  }

  this.setState({ error })
  return error
}

CustomizeGasModal.prototype.convertAndSetGasLimit = function (newGasLimit) {
  const { gasPrice } = this.state

  const gasLimit = conversionUtil(newGasLimit, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  })

  const gasTotal = multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  })

  this.validate({ gasTotal, gasLimit })

  this.setState({ gasTotal, gasLimit })
}

CustomizeGasModal.prototype.convertAndSetGasPrice = function (newGasPrice) {
  const { gasLimit } = this.state
  const sigZeros = String(newGasPrice).match(/^\d+[.]\d*?(0+)$/)
  const sigDec = String(newGasPrice).match(/^\d+([.])0*$/)

  this.setState({
    priceSigZeros: sigZeros && sigZeros[1] || '',
    priceSigDec: sigDec && sigDec[1] || '',
  })

  const gasPrice = conversionUtil(newGasPrice, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  })

  const gasTotal = multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  })

  this.validate({ gasTotal })

  this.setState({ gasTotal, gasPrice })
}

CustomizeGasModal.prototype.render = function () {
  const { hideModal, forceGasMin } = this.props
  const { gasPrice, gasLimit, gasTotal, error, priceSigZeros, priceSigDec } = this.state

  let convertedGasPrice = conversionUtil(gasPrice, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  })

  convertedGasPrice += convertedGasPrice.match(/[.]/) ? priceSigZeros : `${priceSigDec}${priceSigZeros}`

  let newGasPrice = gasPrice
  if (forceGasMin) {
    const convertedMinPrice = conversionUtil(forceGasMin, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
    })
    convertedGasPrice = conversionMax(
      { value: convertedMinPrice, fromNumericBase: 'dec' },
      { value: convertedGasPrice, fromNumericBase: 'dec' }
    )
    newGasPrice = conversionMax(
      { value: gasPrice, fromNumericBase: 'hex' },
      { value: forceGasMin, fromNumericBase: 'hex' }
    )
  }

  const convertedGasLimit = conversionUtil(gasLimit, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  })

  return h('div.send-v2__customize-gas', {}, [
    h('div.send-v2__customize-gas__content', {
    }, [
      h('div.send-v2__customize-gas__header', {}, [

        h('div.send-v2__customize-gas__title', this.context.t('customGas')),

        h('div.send-v2__customize-gas__close', {
          onClick: hideModal,
        }),

      ]),

      h('div.send-v2__customize-gas__body', {}, [

        h(GasModalCard, {
          value: convertedGasPrice,
          min: forceGasMin || MIN_GAS_PRICE_GWEI,
          // max: 1000,
          step: multiplyCurrencies(MIN_GAS_PRICE_GWEI, 10),
          onChange: value => this.convertAndSetGasPrice(value),
          title: this.context.t('gasPrice'),
          copy: this.context.t('gasPriceCalculation'),
        }),

        h(GasModalCard, {
          value: convertedGasLimit,
          min: 1,
          // max: 100000,
          step: 1,
          onChange: value => this.convertAndSetGasLimit(value),
          title: this.context.t('gasLimit'),
          copy: this.context.t('gasLimitCalculation'),
        }),

      ]),

      h('div.send-v2__customize-gas__footer', {}, [

        error && h('div.send-v2__customize-gas__error-message', [
          error,
        ]),

        h('div.send-v2__customize-gas__revert', {
          onClick: () => this.revert(),
        }, [this.context.t('revert')]),

        h('div.send-v2__customize-gas__buttons', [
          h('button.btn-secondary.send-v2__customize-gas__cancel', {
            onClick: this.props.hideModal,
            style: {
              marginRight: '10px',
            },
          }, [this.context.t('cancel')]),

          h('button.btn-primary.send-v2__customize-gas__save', {
            onClick: () => !error && this.save(newGasPrice, gasLimit, gasTotal),
            className: error && 'btn-primary--disabled',
          }, [this.context.t('save')]),
        ]),

      ]),

    ]),
  ])
}
