const Component = require('react').Component
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const tokenAbi = require('human-standard-token-abi')
const abiDecoder = require('abi-decoder')
abiDecoder.addABI(tokenAbi)
const actions = require('../../actions')
const clone = require('clone')
const Identicon = require('../identicon')
const GasFeeDisplay = require('../send/gas-fee-display-v2.js')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const {
  conversionUtil,
  multiplyCurrencies,
  addCurrencies,
} = require('../../conversion-util')
const {
  getGasTotal,
  isBalanceSufficient,
} = require('../send/send-utils')
const {
  calcTokenAmount,
} = require('../../token-util')
const classnames = require('classnames')

const { MIN_GAS_PRICE_HEX } = require('../send/send-constants')

const {
  getTokenExchangeRate,
  getSelectedAddress,
  getSelectedTokenContract,
} = require('../../selectors')

ConfirmSendToken.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ConfirmSendToken)


function mapStateToProps (state, ownProps) {
  const { token: { symbol }, txData } = ownProps
  const { txParams } = txData || {}
  const tokenData = txParams.data && abiDecoder.decodeMethod(txParams.data)

  const {
    conversionRate,
    identities,
    currentCurrency,
  } = state.metamask
  const accounts = state.metamask.accounts
  const selectedAddress = getSelectedAddress(state)
  const tokenExchangeRate = getTokenExchangeRate(state, symbol)
  const { balance } = accounts[selectedAddress]
  return {
    conversionRate,
    identities,
    selectedAddress,
    tokenExchangeRate,
    tokenData: tokenData || {},
    currentCurrency: currentCurrency.toUpperCase(),
    send: state.metamask.send,
    tokenContract: getSelectedTokenContract(state),
    balance,
  }
}

function mapDispatchToProps (dispatch, ownProps) {
  const { token: { symbol } } = ownProps

  return {
    backToAccountDetail: address => dispatch(actions.backToAccountDetail(address)),
    cancelTransaction: ({ id }) => dispatch(actions.cancelTx({ id })),
    updateTokenExchangeRate: () => dispatch(actions.updateTokenExchangeRate(symbol)),
    editTransaction: txMeta => {
      const { token: { address } } = ownProps
      const { txParams = {}, id } = txMeta
      const tokenData = txParams.data && abiDecoder.decodeMethod(txParams.data) || {}
      const { params = [] } = tokenData
      const { value: to } = params[0] || {}
      const { value: tokenAmountInDec } = params[1] || {}
      const tokenAmountInHex = conversionUtil(tokenAmountInDec, {
        fromNumericBase: 'dec',
        toNumericBase: 'hex',
      })
      const {
        gas: gasLimit,
        gasPrice,
      } = txParams
      dispatch(actions.setSelectedToken(address))
      dispatch(actions.updateSend({
        gasLimit,
        gasPrice,
        gasTotal: null,
        to,
        amount: tokenAmountInHex,
        errors: { to: null, amount: null },
        editingTransactionId: id,
        token: ownProps.token,
      }))
      dispatch(actions.showSendTokenPage())
    },
    showCustomizeGasModal: (txMeta, sendGasLimit, sendGasPrice, sendGasTotal) => {
      const { id, txParams, lastGasPrice } = txMeta
      const { gas: txGasLimit, gasPrice: txGasPrice } = txParams
      const tokenData = txParams.data && abiDecoder.decodeMethod(txParams.data)
      const { params = [] } = tokenData
      const { value: to } = params[0] || {}
      const { value: tokenAmountInDec } = params[1] || {}
      const tokenAmountInHex = conversionUtil(tokenAmountInDec, {
        fromNumericBase: 'dec',
        toNumericBase: 'hex',
      })

      let forceGasMin
      if (lastGasPrice) {
        forceGasMin = ethUtil.addHexPrefix(multiplyCurrencies(lastGasPrice, 1.1, {
          multiplicandBase: 16,
          multiplierBase: 10,
          toNumericBase: 'hex',
          fromDenomination: 'WEI',
        }))
      }

      dispatch(actions.updateSend({
        gasLimit: sendGasLimit || txGasLimit,
        gasPrice: sendGasPrice || txGasPrice,
        editingTransactionId: id,
        gasTotal: sendGasTotal,
        to,
        amount: tokenAmountInHex,
        forceGasMin,
      }))
      dispatch(actions.showModal({ name: 'CUSTOMIZE_GAS' }))
    },
    updateSendErrors: error => dispatch(actions.updateSendErrors(error)),
  }
}

inherits(ConfirmSendToken, Component)
function ConfirmSendToken () {
  Component.call(this)
  this.state = {}
  this.onSubmit = this.onSubmit.bind(this)
}

ConfirmSendToken.prototype.updateComponentSendErrors = function (prevProps) {
  const {
    balance: oldBalance,
    conversionRate: oldConversionRate,
  } = prevProps
  const {
    updateSendErrors,
    balance,
    conversionRate,
    send: {
      errors: {
        simulationFails,
      },
    },
  } = this.props
  const txMeta = this.gatherTxMeta()

  const shouldUpdateBalanceSendErrors = balance && [
    balance !== oldBalance,
    conversionRate !== oldConversionRate,
  ].some(x => Boolean(x))

  if (shouldUpdateBalanceSendErrors) {
    const balanceIsSufficient = this.isBalanceSufficient(txMeta)
    updateSendErrors({
      insufficientFunds: balanceIsSufficient ? false : this.context.t('insufficientFunds'),
    })
  }

  const shouldUpdateSimulationSendError = Boolean(txMeta.simulationFails) !== Boolean(simulationFails)

  if (shouldUpdateSimulationSendError) {
    updateSendErrors({
      simulationFails: !txMeta.simulationFails ? false : this.context.t('transactionError'),
    })
  }
}

ConfirmSendToken.prototype.componentWillMount = function () {
  const { tokenContract, selectedAddress } = this.props
  tokenContract && tokenContract
    .balanceOf(selectedAddress)
    .then(usersToken => {
    })
  this.props.updateTokenExchangeRate()
  this.updateComponentSendErrors({})
}

ConfirmSendToken.prototype.componentDidUpdate = function (prevProps) {
  this.updateComponentSendErrors(prevProps)
}

ConfirmSendToken.prototype.getAmount = function () {
  const {
    conversionRate,
    tokenExchangeRate,
    token,
    tokenData,
    send: { amount, editingTransactionId },
  } = this.props
  const { params = [] } = tokenData
  let { value } = params[1] || {}
  const { decimals } = token

  if (editingTransactionId) {
    value = conversionUtil(amount, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
    })
  }

  const sendTokenAmount = calcTokenAmount(value, decimals)

  return {
    fiat: tokenExchangeRate
      ? +(sendTokenAmount * tokenExchangeRate * conversionRate).toFixed(2)
      : null,
    token: typeof value === 'undefined'
      ? this.context.t('unknown')
      : +sendTokenAmount.toFixed(decimals),
  }

}

ConfirmSendToken.prototype.getGasFee = function () {
  const { conversionRate, tokenExchangeRate, token, currentCurrency } = this.props
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}
  const { decimals } = token

  const gas = txParams.gas
  const gasPrice = txParams.gasPrice || MIN_GAS_PRICE_HEX
  const gasTotal = multiplyCurrencies(gas, gasPrice, {
    multiplicandBase: 16,
    multiplierBase: 16,
  })

  const FIAT = conversionUtil(gasTotal, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency: 'AKA',
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  })
  const ETH = conversionUtil(gasTotal, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency: 'AKA',
    toCurrency: 'AKA',
    numberOfDecimals: 6,
    conversionRate,
  })
  const tokenGas = multiplyCurrencies(gas, gasPrice, {
    toNumericBase: 'dec',
    multiplicandBase: 16,
    multiplierBase: 16,
    toCurrency: 'BAT',
    conversionRate: tokenExchangeRate,
    invertConversionRate: true,
    fromDenomination: 'WEI',
    numberOfDecimals: decimals || 4,
  })

  return {
    fiat: +Number(FIAT).toFixed(2),
    eth: ETH,
    token: tokenExchangeRate
      ? tokenGas
      : null,
    gasFeeInHex: gasTotal.toString(16),
  }
}

ConfirmSendToken.prototype.getData = function () {
  const { identities, tokenData } = this.props
  const { params = [] } = tokenData
  const { value } = params[0] || {}
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  return {
    from: {
      address: txParams.from,
      name: identities[txParams.from].name,
    },
    to: {
      address: value,
      name: identities[value] ? identities[value].name : this.context.t('newRecipient'),
    },
    memo: txParams.memo || '',
  }
}

ConfirmSendToken.prototype.renderHeroAmount = function () {
  const { token: { symbol }, currentCurrency } = this.props
  const { fiat: fiatAmount, token: tokenAmount } = this.getAmount()
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}
  const { memo = '' } = txParams

  return fiatAmount
    ? (
      h('div.confirm-send-token__hero-amount-wrapper', [
        h('h3.flex-center.confirm-screen-send-amount', `${fiatAmount}`),
        h('h3.flex-center.confirm-screen-send-amount-currency', currentCurrency),
        h('div.flex-center.confirm-memo-wrapper', [
          h('h3.confirm-screen-send-memo', [ memo ? `"${memo}"` : '' ]),
        ]),
      ])
    )
    : (
      h('div.confirm-send-token__hero-amount-wrapper', [
        h('h3.flex-center.confirm-screen-send-amount', tokenAmount),
        h('h3.flex-center.confirm-screen-send-amount-currency', symbol),
        h('div.flex-center.confirm-memo-wrapper', [
          h('h3.confirm-screen-send-memo', [ memo ? `"${memo}"` : '' ]),
        ]),
      ])
    )
}

ConfirmSendToken.prototype.renderGasFee = function () {
  const {
    currentCurrency: convertedCurrency,
    conversionRate,
    send: { gasTotal, gasLimit: sendGasLimit, gasPrice: sendGasPrice },
    showCustomizeGasModal,
  } = this.props
  const txMeta = this.gatherTxMeta()
  const { gasFeeInHex } = this.getGasFee()

  return (
    h('section.flex-row.flex-center.confirm-screen-row', [
      h('span.confirm-screen-label.confirm-screen-section-column', [ this.context.t('gasFee') ]),
      h('div.confirm-screen-section-column', [
        h(GasFeeDisplay, {
          gasTotal: gasTotal || gasFeeInHex,
          conversionRate,
          convertedCurrency,
          onClick: () => showCustomizeGasModal(txMeta, sendGasLimit, sendGasPrice, gasTotal),
        }),
      ]),
    ])
  )
}

ConfirmSendToken.prototype.renderTotalPlusGas = function () {
  const { token: { symbol }, currentCurrency, send: { errors } } = this.props
  const { fiat: fiatAmount, token: tokenAmount } = this.getAmount()
  const { fiat: fiatGas, token: tokenGas } = this.getGasFee()

  return fiatAmount && fiatGas
    ? (
      h('section.flex-row.flex-center.confirm-screen-row.confirm-screen-total-box ', [
        h('div.confirm-screen-section-column', [
          h('span.confirm-screen-label', [ this.context.t('total') + ' ' ]),
          h('div.confirm-screen-total-box__subtitle', [ this.context.t('amountPlusGas') ]),
        ]),

        h('div.confirm-screen-section-column', [
          h('div.confirm-screen-row-info', `${addCurrencies(fiatAmount, fiatGas)} ${currentCurrency}`),
          h('div.confirm-screen-row-detail', `${addCurrencies(tokenAmount, tokenGas || '0')} ${symbol}`),
        ]),
      ])
    )
    : (
      h('section.flex-row.flex-center.confirm-screen-row.confirm-screen-total-box ', [
        h('div', {
          className: classnames({
            'confirm-screen-section-column--with-error': errors['insufficientFunds'],
            'confirm-screen-section-column': !errors['insufficientFunds'],
          }),
        }, [
          h('span.confirm-screen-label', [ this.context.t('total') + ' ' ]),
          h('div.confirm-screen-total-box__subtitle', [ this.context.t('amountPlusGas') ]),
        ]),

        h('div.confirm-screen-section-column', [
          h('div.confirm-screen-row-info', `${tokenAmount} ${symbol}`),
          h('div.confirm-screen-row-detail', `+ ${fiatGas} ${currentCurrency} ${this.context.t('gas')}`),
        ]),

        this.renderErrorMessage('insufficientFunds'),
      ])
    )
}

ConfirmSendToken.prototype.renderErrorMessage = function (message) {
  const { send: { errors } } = this.props

  return errors[message]
    ? h('div.confirm-screen-error', [ errors[message] ])
    : null
}

ConfirmSendToken.prototype.render = function () {
  const { editTransaction } = this.props
  const txMeta = this.gatherTxMeta()
  const {
    from: {
      address: fromAddress,
      name: fromName,
    },
    to: {
      address: toAddress,
      name: toName,
    },
  } = this.getData()

  this.inputs = []

  const isTxReprice = Boolean(txMeta.lastGasPrice)
  const title = isTxReprice ? this.context.t('reprice_title') : this.context.t('confirm')
  const subtitle = isTxReprice
    ? this.context.t('reprice_subtitle')
    : this.context.t('pleaseReviewTransaction')

  return (
    h('div.confirm-screen-container.confirm-send-token', [
      // Main Send token Card
      h('div.page-container', [
        h('div.page-container__header', [
          !txMeta.lastGasPrice && h('button.confirm-screen-back-button', {
            onClick: () => editTransaction(txMeta),
          }, this.context.t('edit')),
          h('div.page-container__title', title),
          h('div.page-container__subtitle', subtitle),
        ]),
        h('.page-container__content', [
          h('div.flex-row.flex-center.confirm-screen-identicons', [
            h('div.confirm-screen-account-wrapper', [
              h(
                Identicon,
                {
                  address: fromAddress,
                  diameter: 60,
                },
              ),
              h('span.confirm-screen-account-name', fromName),
              // h('span.confirm-screen-account-number', fromAddress.slice(fromAddress.length - 4)),
            ]),
            h('i.fa.fa-arrow-right.fa-lg'),
            h('div.confirm-screen-account-wrapper', [
              h(
                Identicon,
                {
                  address: toAddress,
                  diameter: 60,
                },
              ),
              h('span.confirm-screen-account-name', toName),
              // h('span.confirm-screen-account-number', toAddress.slice(toAddress.length - 4)),
            ]),
          ]),

          // h('h3.flex-center.confirm-screen-sending-to-message', {
          //   style: {
          //     textAlign: 'center',
          //     fontSize: '16px',
          //   },
          // }, [
            // `You're sending to Recipient ...${toAddress.slice(toAddress.length - 4)}`,
          // ]),

          this.renderHeroAmount(),

          h('div.confirm-screen-rows', [
            h('section.flex-row.flex-center.confirm-screen-row', [
              h('span.confirm-screen-label.confirm-screen-section-column', [ this.context.t('from') ]),
              h('div.confirm-screen-section-column', [
                h('div.confirm-screen-row-info', fromName),
                h('div.confirm-screen-row-detail', `...${fromAddress.slice(fromAddress.length - 4)}`),
              ]),
            ]),

            toAddress && h('section.flex-row.flex-center.confirm-screen-row', [
              h('span.confirm-screen-label.confirm-screen-section-column', [ this.context.t('to') ]),
              h('div.confirm-screen-section-column', [
                h('div.confirm-screen-row-info', toName),
                h('div.confirm-screen-row-detail', `...${toAddress.slice(toAddress.length - 4)}`),
              ]),
            ]),

            this.renderGasFee(),

            this.renderTotalPlusGas(),

          ]),

        ]),

        h('form#pending-tx-form', {
          className: 'confirm-screen-form',
          onSubmit: this.onSubmit,
        }, [
          this.renderErrorMessage('simulationFails'),
          h('.page-container__footer', [
            // Cancel Button
            h('button.btn-cancel.page-container__footer-button.allcaps', {
              onClick: (event) => this.cancel(event, txMeta),
            }, this.context.t('cancel')),

            // Accept Button
            h('button.btn-confirm.page-container__footer-button.allcaps', [this.context.t('confirm')]),
          ]),
        ]),
      ]),
    ])
  )
}

ConfirmSendToken.prototype.onSubmit = function (event) {
  event.preventDefault()
  const { updateSendErrors } = this.props
  const txMeta = this.gatherTxMeta()
  const valid = this.checkValidity()
  const balanceIsSufficient = this.isBalanceSufficient(txMeta)
  this.setState({ valid, submitting: true })

  if (valid && this.verifyGasParams() && balanceIsSufficient) {
    this.props.sendTransaction(txMeta, event)
  } else if (!balanceIsSufficient) {
    updateSendErrors({ insufficientFunds: this.context.t('insufficientFunds') })
  } else {
    updateSendErrors({ invalidGasParams: this.context.t('invalidGasParams') })
    this.setState({ submitting: false })
  }
}

ConfirmSendToken.prototype.isBalanceSufficient = function (txMeta) {
  const {
    balance,
    conversionRate,
  } = this.props
  const {
    txParams: {
      gas,
      gasPrice,
    },
  } = txMeta
  const gasTotal = getGasTotal(gas, gasPrice)

  return isBalanceSufficient({
    amount: '0',
    gasTotal,
    balance,
    conversionRate,
  })
}


ConfirmSendToken.prototype.cancel = function (event, txMeta) {
  event.preventDefault()
  const { cancelTransaction } = this.props

  cancelTransaction(txMeta)
}

ConfirmSendToken.prototype.checkValidity = function () {
  const form = this.getFormEl()
  const valid = form.checkValidity()
  return valid
}

ConfirmSendToken.prototype.getFormEl = function () {
  const form = document.querySelector('form#pending-tx-form')
  // Stub out form for unit tests:
  if (!form) {
    return { checkValidity () { return true } }
  }
  return form
}

// After a customizable state value has been updated,
ConfirmSendToken.prototype.gatherTxMeta = function () {
  const props = this.props
  const state = this.state
  const txData = clone(state.txData) || clone(props.txData)

  const { gasPrice: sendGasPrice, gas: sendGasLimit } = props.send
  const {
    lastGasPrice,
    txParams: {
      gasPrice: txGasPrice,
      gas: txGasLimit,
    },
  } = txData

  let forceGasMin
  if (lastGasPrice) {
    forceGasMin = ethUtil.addHexPrefix(multiplyCurrencies(lastGasPrice, 1.1, {
      multiplicandBase: 16,
      multiplierBase: 10,
      toNumericBase: 'hex',
    }))
  }

  txData.txParams.gasPrice = sendGasPrice || forceGasMin || txGasPrice
  txData.txParams.gas = sendGasLimit || txGasLimit

  // log.debug(`UI has defaulted to tx meta ${JSON.stringify(txData)}`)
  return txData
}

ConfirmSendToken.prototype.verifyGasParams = function () {
  // We call this in case the gas has not been modified at all
  if (!this.state) { return true }
  return (
    this._notZeroOrEmptyString(this.state.gas) &&
    this._notZeroOrEmptyString(this.state.gasPrice)
  )
}

ConfirmSendToken.prototype._notZeroOrEmptyString = function (obj) {
  return obj !== '' && obj !== '0x0'
}

ConfirmSendToken.prototype.bnMultiplyByFraction = function (targetBN, numerator, denominator) {
  const numBN = new BN(numerator)
  const denomBN = new BN(denominator)
  return targetBN.mul(numBN).div(denomBN)
}
