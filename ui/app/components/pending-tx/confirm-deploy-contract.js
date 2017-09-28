const Component = require('react').Component
const { connect } = require('react-redux')
const h = require('react-hyperscript')
const inherits = require('util').inherits
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


module.exports = connect(mapStateToProps, mapDispatchToProps)(ConfirmDeployContract)

function mapStateToProps (state) {
  const {
    conversionRate,
    identities,
  } = state.metamask
  const accounts = state.metamask.accounts
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  return {
    conversionRate,
    identities,
    selectedAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    backToAccountDetail: address => dispatch(actions.backToAccountDetail(address)),
    cancelTransaction: ({ id }) => dispatch(actions.cancelTx({ id })),
  }
}


inherits(ConfirmDeployContract, Component)
function ConfirmDeployContract () {
  Component.call(this)
  this.state = {}
  this.onSubmit = this.onSubmit.bind(this)
}

ConfirmDeployContract.prototype.onSubmit = function (event) {
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

ConfirmDeployContract.prototype.cancel = function (event, txMeta) {
  event.preventDefault()
  this.props.cancelTransaction(txMeta)
}

ConfirmDeployContract.prototype.checkValidity = function () {
  const form = this.getFormEl()
  const valid = form.checkValidity()
  return valid
}

ConfirmDeployContract.prototype.getFormEl = function () {
  const form = document.querySelector('form#pending-tx-form')
  // Stub out form for unit tests:
  if (!form) {
    return { checkValidity () { return true } }
  }
  return form
}

// After a customizable state value has been updated,
ConfirmDeployContract.prototype.gatherTxMeta = function () {
  const props = this.props
  const state = this.state
  const txData = clone(state.txData) || clone(props.txData)

  // log.debug(`UI has defaulted to tx meta ${JSON.stringify(txData)}`)
  return txData
}

ConfirmDeployContract.prototype.verifyGasParams = function () {
  // We call this in case the gas has not been modified at all
  if (!this.state) { return true }
  return (
    this._notZeroOrEmptyString(this.state.gas) &&
    this._notZeroOrEmptyString(this.state.gasPrice)
  )
}

ConfirmDeployContract.prototype._notZeroOrEmptyString = function (obj) {
  return obj !== '' && obj !== '0x0'
}

ConfirmDeployContract.prototype.bnMultiplyByFraction = function (targetBN, numerator, denominator) {
  const numBN = new BN(numerator)
  const denomBN = new BN(denominator)
  return targetBN.mul(numBN).div(denomBN)
}

ConfirmDeployContract.prototype.getData = function () {
  const { identities } = this.props
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  return {
    from: {
      address: txParams.from,
      name: identities[txParams.from].name,
    },
    memo: txParams.memo || '',
  }
}

ConfirmDeployContract.prototype.getAmount = function () {
  const { conversionRate } = this.props
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  const USD = conversionUtil(txParams.value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: 'USD',
    numberOfDecimals: 2,
    fromDenomination: 'WEI',
    conversionRate,
  })
  const ETH = conversionUtil(txParams.value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: 'ETH',
    fromDenomination: 'WEI',
    conversionRate,
    numberOfDecimals: 6,
  })

  return {
    fiat: Number(USD),
    token: Number(ETH),
  }

}

ConfirmDeployContract.prototype.getGasFee = function () {
  const { conversionRate } = this.props
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

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
    fiat: Number(USD),
    eth: Number(ETH),
  }
}
ConfirmDeployContract.prototype.renderGasFee = function () {
  const { fiat: fiatGas, eth: ethGas } = this.getGasFee()

  return (
    h('section.flex-row.flex-center.confirm-screen-row', [
      h('span.confirm-screen-label.confirm-screen-section-column', [ 'Gas Fee' ]),
      h('div.confirm-screen-section-column', [
        h('div.confirm-screen-row-info', `$${fiatGas} USD`),

        h(
          'div.confirm-screen-row-detail',
          `${ethGas} ETH`
        ),
      ]),
    ])
  )
}

ConfirmDeployContract.prototype.renderHeroAmount = function () {
  const { fiat: fiatAmount } = this.getAmount()
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}
  const { memo = '' } = txParams

  return (
    h('div.confirm-send-token__hero-amount-wrapper', [
      h('h3.flex-center.confirm-screen-send-amount', `$${fiatAmount}`),
      h('h3.flex-center.confirm-screen-send-amount-currency', 'USD'),
      h('div.flex-center.confirm-memo-wrapper', [
        h('h3.confirm-screen-send-memo', memo),
      ]),
    ])
  )
}

ConfirmDeployContract.prototype.renderTotalPlusGas = function () {
  const { fiat: fiatAmount, token: tokenAmount } = this.getAmount()
  const { fiat: fiatGas, eth: ethGas } = this.getGasFee()

  return (
    h('section.flex-row.flex-center.confirm-screen-total-box ', [
      h('div.confirm-screen-section-column', [
        h('span.confirm-screen-label', [ 'Total ' ]),
        h('div.confirm-screen-total-box__subtitle', [ 'Amount + Gas' ]),
      ]),

      h('div.confirm-screen-section-column', [
        h('div.confirm-screen-row-info', `$${fiatAmount + fiatGas} USD`),
        h('div.confirm-screen-row-detail', `${tokenAmount + ethGas} ETH`),
      ]),
    ])
  )
}

ConfirmDeployContract.prototype.render = function () {
  const { backToAccountDetail, selectedAddress } = this.props
  const txMeta = this.gatherTxMeta()

  const {
    from: {
      address: fromAddress,
      name: fromName,
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
            h('i.fa.fa-file-text-o'),
            h('span.confirm-screen-account-name', 'New Contract'),
            h('span.confirm-screen-account-number', ' '),
          ]),
        ]),

        h('h3.flex-center.confirm-screen-sending-to-message', {
          style: {
            textAlign: 'center',
            fontSize: '16px',
          },
        }, [
          `You're deploying a new contract.`,
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
              h('div.confirm-screen-row-info', 'New Contract'),
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
