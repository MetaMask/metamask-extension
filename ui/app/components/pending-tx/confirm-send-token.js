const Component = require('react').Component
const { connect } = require('react-redux')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const abi = require('human-standard-token-abi')
const abiDecoder = require('abi-decoder')
abiDecoder.addABI(abi)
const actions = require('../../actions')
const clone = require('clone')
const Identicon = require('../identicon')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const hexToBn = require('../../../../app/scripts/lib/hex-to-bn')
const { conversionUtil } = require('../../conversion-util')

const MIN_GAS_PRICE_GWEI_BN = new BN(1)
const GWEI_FACTOR = new BN(1e9)
const MIN_GAS_PRICE_BN = MIN_GAS_PRICE_GWEI_BN.mul(GWEI_FACTOR)

module.exports = connect(mapStateToProps, mapDispatchToProps)(ConfirmSendToken)

function mapStateToProps (state, ownProps) {
  const { token: { symbol }, txData } = ownProps
  const { txParams } = txData || {}
  const tokenData = txParams.data && abiDecoder.decodeMethod(txParams.data)
  const {
    conversionRate,
    identities,
  } = state.metamask
  const accounts = state.metamask.accounts
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  const tokenExchangeRates = state.metamask.tokenExchangeRates
  const pair = `${symbol.toLowerCase()}_eth`
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates[pair] || {}

  return {
    conversionRate,
    identities,
    selectedAddress,
    tokenExchangeRate,
    tokenData: tokenData || {},
  }
}

function mapDispatchToProps (dispatch, ownProps) {
  const { token: { symbol } } = ownProps

  return {
    backToAccountDetail: address => dispatch(actions.backToAccountDetail(address)),
    cancelTransaction: ({ id }) => dispatch(actions.cancelTx({ id })),
    updateTokenExchangeRate: () => dispatch(actions.updateTokenExchangeRate(symbol)),
  }
}

inherits(ConfirmSendToken, Component)
function ConfirmSendToken () {
  Component.call(this)
  this.state = {}
  this.onSubmit = this.onSubmit.bind(this)
}

ConfirmSendToken.prototype.componentWillMount = function () {
  this.props.updateTokenExchangeRate()
}

ConfirmSendToken.prototype.getAmount = function () {
  const { conversionRate, tokenExchangeRate, token, tokenData } = this.props
  const { params = [] } = tokenData
  const { value } = params[1] || {}
  const { decimals } = token
  const multiplier = Math.pow(10, Number(decimals || 0))
  const sendTokenAmount = Number(value / multiplier)

  return {
    fiat: tokenExchangeRate
      ? +(sendTokenAmount * tokenExchangeRate * conversionRate).toFixed(2)
      : null,
    token: +sendTokenAmount.toFixed(decimals),
  }

}

ConfirmSendToken.prototype.getGasFee = function () {
  const { conversionRate, tokenExchangeRate, token } = this.props
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}
  const { decimals } = token

  // Gas
  const gas = txParams.gas
  const gasBn = hexToBn(gas)

  // Gas Price
  const gasPrice = txParams.gasPrice || MIN_GAS_PRICE_BN.toString(16)
  const gasPriceBn = hexToBn(gasPrice)
  const txFeeBn = gasBn.mul(gasPriceBn)


  const USD = conversionUtil(txFeeBn, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency: 'ETH',
    toCurrency: 'USD',
    numberOfDecimals: 2,
    conversionRate,
  })
  const ETH = conversionUtil(txFeeBn, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency: 'ETH',
    toCurrency: 'ETH',
    numberOfDecimals: 6,
    conversionRate,
  })

  return {
    fiat: +Number(USD).toFixed(2),
    eth: ETH,
    token: tokenExchangeRate
      ? +(ETH * tokenExchangeRate).toFixed(decimals)
      : null,
  }
}

ConfirmSendToken.prototype.getData = function () {
  const { identities } = this.props
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  return {
    from: {
      address: txParams.from,
      name: identities[txParams.from].name,
    },
    to: {
      address: txParams.to,
      name: identities[txParams.to] ? identities[txParams.to].name : 'New Recipient',
    },
    memo: txParams.memo || '',
  }
}

ConfirmSendToken.prototype.renderHeroAmount = function () {
  const { token: { symbol } } = this.props
  const { fiat: fiatAmount, token: tokenAmount } = this.getAmount()
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}
  const { memo = '' } = txParams

  return fiatAmount
    ? (
      h('div.confirm-send-token__hero-amount-wrapper', [
        h('h3.flex-center.confirm-screen-send-amount', `$${fiatAmount}`),
        h('h3.flex-center.confirm-screen-send-amount-currency', 'USD'),
        h('div.flex-center.confirm-memo-wrapper', [
          h('h3.confirm-screen-send-memo', memo),
        ]),
      ])
    )
    : (
      h('div.confirm-send-token__hero-amount-wrapper', [
        h('h3.flex-center.confirm-screen-send-amount', tokenAmount),
        h('h3.flex-center.confirm-screen-send-amount-currency', symbol),
        h('div.flex-center.confirm-memo-wrapper', [
          h('h3.confirm-screen-send-memo', memo),
        ]),
      ])
    )
}

ConfirmSendToken.prototype.renderGasFee = function () {
  const { token: { symbol } } = this.props
  const { fiat: fiatGas, token: tokenGas, eth: ethGas } = this.getGasFee()

  return (
    h('section.flex-row.flex-center.confirm-screen-row', [
      h('span.confirm-screen-label.confirm-screen-section-column', [ 'Gas Fee' ]),
      h('div.confirm-screen-section-column', [
        h('div.confirm-screen-row-info', `$${fiatGas} USD`),

        h(
          'div.confirm-screen-row-detail',
          tokenGas ? `${tokenGas} ${symbol}` : `${ethGas} ETH`
        ),
      ]),
    ])
  )
}

ConfirmSendToken.prototype.renderTotalPlusGas = function () {
  const { token: { symbol } } = this.props
  const { fiat: fiatAmount, token: tokenAmount } = this.getAmount()
  const { fiat: fiatGas, token: tokenGas } = this.getGasFee()

  return fiatAmount && fiatGas
    ? (
      h('section.flex-row.flex-center.confirm-screen-total-box ', [
        h('div.confirm-screen-section-column', [
          h('span.confirm-screen-label', [ 'Total ' ]),
          h('div.confirm-screen-total-box__subtitle', [ 'Amount + Gas' ]),
        ]),

        h('div.confirm-screen-section-column', [
          h('div.confirm-screen-row-info', `$${fiatAmount + fiatGas} USD`),
          h('div.confirm-screen-row-detail', `${tokenAmount + tokenGas} ${symbol}`),
        ]),
      ])
    )
    : (
      h('section.flex-row.flex-center.confirm-screen-total-box ', [
        h('div.confirm-screen-section-column', [
          h('span.confirm-screen-label', [ 'Total ' ]),
          h('div.confirm-screen-total-box__subtitle', [ 'Amount + Gas' ]),
        ]),

        h('div.confirm-screen-section-column', [
          h('div.confirm-screen-row-info', `${tokenAmount} ${symbol}`),
          h('div.confirm-screen-row-detail', `+ ${fiatGas} USD Gas`),
        ]),
      ])
    )
}

ConfirmSendToken.prototype.render = function () {
  const { backToAccountDetail, selectedAddress } = this.props
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

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

  return (
    h('div.flex-column.flex-grow.confirm-screen-container', {
      style: { minWidth: '355px' },
    }, [
      // Main Send token Card
      h('div.confirm-screen-wrapper.flex-column.flex-grow', [
        h('h3.flex-center.confirm-screen-header', [
          h('button.confirm-screen-back-button', {
            onClick: () => backToAccountDetail(selectedAddress),
          }, 'BACK'),
          h('div.confirm-screen-title', 'Confirm Transaction'),
        ]),
        h('div.flex-row.flex-center.confirm-screen-identicons', [
          h('div.confirm-screen-account-wrapper', [
            h(
              Identicon,
              {
                address: fromAddress,
                diameter: 100,
              },
            ),
            h('span.confirm-screen-account-name', fromName),
            h('span.confirm-screen-account-number', fromAddress.slice(fromAddress.length - 4)),
          ]),
          h('i.fa.fa-arrow-right.fa-lg'),
          h('div.confirm-screen-account-wrapper', [
            h(
              Identicon,
              {
                address: txParams.to,
                diameter: 100,
              },
            ),
            h('span.confirm-screen-account-name', toName),
            h('span.confirm-screen-account-number', toAddress.slice(toAddress.length - 4)),
          ]),
        ]),

        h('h3.flex-center.confirm-screen-sending-to-message', {
          style: {
            textAlign: 'center',
            fontSize: '16px',
          },
        }, [
          `You're sending to Recipient ...${toAddress.slice(toAddress.length - 4)}`,
        ]),

        this.renderHeroAmount(),

        h('div.confirm-screen-rows', [
          h('section.flex-row.flex-center.confirm-screen-row', [
            h('span.confirm-screen-label.confirm-screen-section-column', [ 'From' ]),
            h('div.confirm-screen-section-column', [
              h('div.confirm-screen-row-info', fromName),
              h('div.confirm-screen-row-detail', `...${fromAddress.slice(fromAddress.length - 4)}`),
            ]),
          ]),

          h('section.flex-row.flex-center.confirm-screen-row', [
            h('span.confirm-screen-label.confirm-screen-section-column', [ 'To' ]),
            h('div.confirm-screen-section-column', [
              h('div.confirm-screen-row-info', toName),
              h('div.confirm-screen-row-detail', `...${toAddress.slice(toAddress.length - 4)}`),
            ]),
          ]),

          this.renderGasFee(),

          this.renderTotalPlusGas(),

        ]),
      ]),

      h('form#pending-tx-form.flex-column.flex-center', {
        onSubmit: this.onSubmit,
      }, [

        // Accept Button
        h('button.confirm-screen-confirm-button', ['CONFIRM']),

        // Cancel Button
        h('div.cancel.btn-light.confirm-screen-cancel-button', {
          onClick: (event) => this.cancel(event, txMeta),
        }, 'CANCEL'),
      ]),
    ])
  )
}

ConfirmSendToken.prototype.onSubmit = function (event) {
  event.preventDefault()
  const txMeta = this.gatherTxMeta()
  const valid = this.checkValidity()
  this.setState({ valid, submitting: true })

  if (valid && this.verifyGasParams()) {
    this.props.sendTransaction(txMeta, event)
  } else {
    this.props.dispatch(actions.displayWarning('Invalid Gas Parameters'))
    this.setState({ submitting: false })
  }
}

ConfirmSendToken.prototype.cancel = function (event, txMeta) {
  event.preventDefault()
  this.props.cancelTransaction(txMeta)
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
