const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const GasModalCard = require('./gas-modal-card')

const {
  MIN_GAS_PRICE_DEC,
  MIN_GAS_LIMIT_DEC,
  MIN_GAS_PRICE_GWEI,
} = require('../send/send-constants')

const {
  isBalanceSufficient,
} = require('../send/send-utils')

const {
  conversionUtil,
  multiplyCurrencies,
  conversionGreaterThan,
} = require('../../conversion-util')

const {
  getGasPrice,
  getGasLimit,
  conversionRateSelector,
  getSendAmount,
  getSelectedToken,
  getSendFrom,
  getCurrentAccountWithSendEtherInfo,
  getSelectedTokenToFiatRate,
} = require('../../selectors')

function mapStateToProps (state) {
  const selectedToken = getSelectedToken(state)
  const currentAccount = getSendFrom(state) || getCurrentAccountWithSendEtherInfo(state)
  const conversionRate = conversionRateSelector(state)

  return {
    gasPrice: getGasPrice(state),
    gasLimit: getGasLimit(state),
    conversionRate,
    amount: getSendAmount(state),
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
    updateGasTotal: newGasTotal => dispatch(actions.updateGasTotal(newGasTotal)),
  }
}

function getOriginalState(props) {
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
  }
}

inherits(CustomizeGasModal, Component)
function CustomizeGasModal (props) {
  Component.call(this)

  this.state = getOriginalState(props)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(CustomizeGasModal)

CustomizeGasModal.prototype.save = function (gasPrice, gasLimit, gasTotal) {
  const {
    updateGasPrice,
    updateGasLimit,
    hideModal,
    updateGasTotal
  } = this.props

  updateGasPrice(gasPrice)
  updateGasLimit(gasLimit)
  updateGasTotal(gasTotal)
  hideModal()
}

CustomizeGasModal.prototype.revert = function () {
  this.setState(getOriginalState(this.props))
}

CustomizeGasModal.prototype.validate = function ({ gasTotal, gasLimit }) {
  const {
    amount,
    balance,
    primaryCurrency,
    selectedToken,
    amountConversionRate,
    conversionRate,
  } = this.props

  let error = null

  const balanceIsSufficient = isBalanceSufficient({
    amount,
    gasTotal,
    balance,
    primaryCurrency,
    selectedToken,
    amountConversionRate,
    conversionRate,
  })

  if (!balanceIsSufficient) {
    error = 'Insufficient balance for current gas total' 
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
    error = 'Gas limit must be at least 21000' 
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
  const { hideModal } = this.props
  const { gasPrice, gasLimit, gasTotal, error } = this.state

  const convertedGasPrice = conversionUtil(gasPrice, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  })

  const convertedGasLimit = conversionUtil(gasLimit, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  })

  return h('div.send-v2__customize-gas', {}, [
    h('div.send-v2__customize-gas__content', {
    }, [
      h('div.send-v2__customize-gas__header', {}, [

        h('div.send-v2__customize-gas__title', 'Customize Gas'),

        h('div.send-v2__customize-gas__close', {
          onClick: hideModal,
        }),

      ]),

      h('div.send-v2__customize-gas__body', {}, [
        
        h(GasModalCard, {
          value: convertedGasPrice,
          min: MIN_GAS_PRICE_GWEI,
          // max: 1000,
          step: MIN_GAS_PRICE_GWEI,
          onChange: value => this.convertAndSetGasPrice(value),
          title: 'Gas Price (GWEI)',
          copy: 'We calculate the suggested gas prices based on network success rates.',
        }),

        h(GasModalCard, {
          value: convertedGasLimit,
          min: 1,
          // max: 100000,
          step: 1,
          onChange: value => this.convertAndSetGasLimit(value),
          title: 'Gas Limit',
          copy: 'We calculate the suggested gas limit based on network success rates.',
        }),

      ]),

      h('div.send-v2__customize-gas__footer', {}, [

        error && h('div.send-v2__customize-gas__error-message', [
          error,
        ]),
        
        h('div.send-v2__customize-gas__revert', {
          onClick: () => this.revert(),
        }, ['Revert']),

        h('div.send-v2__customize-gas__buttons', [
          h('div.send-v2__customize-gas__cancel', {
            onClick: this.props.hideModal,
          }, ['CANCEL']),

          h(`div.send-v2__customize-gas__save${error ? '__error' : ''}`, {
            onClick: () => !error && this.save(gasPrice, gasLimit, gasTotal),
          }, ['SAVE']),
        ])

      ]),

    ]),
  ])
}
