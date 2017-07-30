const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const actions = require('../actions')
const clone = require('clone')

const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const hexToBn = require('../../../app/scripts/lib/hex-to-bn')
const util = require('../util')
const MiniAccountPanel = require('./mini-account-panel')
const Copyable = require('./copyable')
const EthBalance = require('./eth-balance')
const addressSummary = util.addressSummary
const nameForAddress = require('../../lib/contract-namer')
const BNInput = require('./bn-as-decimal-input')

const MIN_GAS_PRICE_GWEI_BN = new BN(1)
const GWEI_FACTOR = new BN(1e9)
const MIN_GAS_PRICE_BN = MIN_GAS_PRICE_GWEI_BN.mul(GWEI_FACTOR)
const MIN_GAS_LIMIT_BN = new BN(21000)


// Faked, for Icon
const Identicon = require('./identicon')
const ARAGON = '960b236A07cf122663c4303350609A66A7B288C0'

module.exports = PendingTx
inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
  this.state = {
    valid: true,
    txData: null,
    submitting: false,
  }
}

// Next: create separate react components
// roughly 5 components:
//   heroIcon
//   numericDisplay (contains symbol + currency)
//   divider
//   contentBox
//   actionButtons
const sectionDivider = h('div', {
  style: {
    height:'1px',
    background:'#E7E7E7',
  },
}),

const contentDivider = h('div', {
  style: {
    marginLeft: '16px',
    marginRight: '16px',
    height:'1px',
    background:'#E7E7E7',
  },
})


PendingTx.prototype.render = function () {
  const props = this.props
  const { currentCurrency, blockGasLimit } = props

  const conversionRate = props.conversionRate
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  // Account Details
  const address = txParams.from || props.selectedAddress
  const identity = props.identities[address] || { address: address }
  const account = props.accounts[address]
  const balance = account ? account.balance : '0x0'

  // recipient check
  const isValidAddress = !txParams.to || util.isValidAddress(txParams.to)

  // Gas
  const gas = txParams.gas
  const gasBn = hexToBn(gas)
  const gasLimit = new BN(parseInt(blockGasLimit))
  const safeGasLimit = this.bnMultiplyByFraction(gasLimit, 19, 20).toString(10)

  // Gas Price
  const gasPrice = txParams.gasPrice || MIN_GAS_PRICE_BN.toString(16)
  const gasPriceBn = hexToBn(gasPrice)

  const txFeeBn = gasBn.mul(gasPriceBn)
  const valueBn = hexToBn(txParams.value)
  const maxCost = txFeeBn.add(valueBn)

  const dataLength = txParams.data ? (txParams.data.length - 2) / 2 : 0

  const balanceBn = hexToBn(balance)
  const insufficientBalance = balanceBn.lt(maxCost)

  this.inputs = []

  return (
    h('div.flex-column.flex-grow', {
      style: {
        // overflow: 'scroll',
        minWidth: '355px', // TODO: maxWidth TBD, use home.html
      },
    }, [

      // Main Send token Card
      h('div.send-screen.flex-column.flex-grow', {
        style: {
          marginLeft: '3.5%',
          marginRight: '3.5%',
          background: '#FFFFFF', // $background-white
          boxShadow: '0 2px 4px 0 rgba(0,0,0,0.08)',
        }
      }, [
        h('section.flex-center.flex-row', {
          style: {
            zIndex: 15, // $token-icon-z-index
            marginTop: '-35px',
          }
        }, [
          h(Identicon, {
            address: ARAGON,
            diameter: 76,
          }),
        ]),

        //
        // Required Fields
        //

        h('h3.flex-center', {
          style: {
            marginTop: '-18px',
            fontSize: '16px',
          },
        }, [
          'Confirm Transaction',
        ]),

        h('h3.flex-center', {
          style: {
            textAlign: 'center',
            fontSize: '12px',
          },
        }, [
          'You\'re sending to Recipient ...5924',
        ]),

        h('h3.flex-center', {
          style: {
            textAlign: 'center',
            fontSize: '36px',
            marginTop: '8px',
          },
        }, [
          '0.24',
        ]),

        h('h3.flex-center', {
          style: {
            textAlign: 'center',
            fontSize: '12px',
            marginTop: '4px',
          },
        }, [
          'ANT',
        ]),

        // error message
        props.error && h('span.error.flex-center', props.error),

        sectionDivider,

        h('section.flex-row.flex-center', {

        }, [
          h('div', {
            style: {
              width: '50%',
            }
          }, [
            h('span', {
              style: {
                textAlign: 'left',
                fontSize: '12px',
              }
            }, [
              'From'
            ])
          ]),

          h('div', {
            style: {
              width: '50%',
            }
          },[
            h('div', {
              style: {
                textAlign: 'left',
                fontSize: '10px',
                marginBottom: '-10px',
              },
            }, 'Aragon Token'),

            h('div', {
              style: {
                textAlign: 'left',
                fontSize: '8px',
              },
            }, 'Your Balance 2.34 ANT')
          ])
        ]),

        contentDivider,

        h('form#pending-tx-form', {
          onSubmit: this.onSubmit.bind(this),
        }, [
          // Reset Button
          h('button', {
            onClick: (event) => {
              this.resetGasFields()
              event.preventDefault()
            },
          }, 'Reset'),

          // Accept Button
          h('input.confirm.btn-green', {
            type: 'submit',
            value: 'SUBMIT',
            style: { marginLeft: '10px' },
            disabled: insufficientBalance || !this.state.valid || !isValidAddress || this.state.submitting,
          }),

          // Cancel Button
          h('button.cancel.btn-red', {
            onClick: props.cancelTransaction,
          }, 'Reject'),
        ]),

      ]) // end of main container
    ]) // end of minwidth wrapper
  )
}

// PendingTx.prototype.gasPriceChanged = function (newBN, valid) {
//   log.info(`Gas price changed to: ${newBN.toString(10)}`)
//   const txMeta = this.gatherTxMeta()
//   txMeta.txParams.gasPrice = '0x' + newBN.toString('hex')
//   this.setState({
//     txData: clone(txMeta),
//     valid,
//   })
// }

// PendingTx.prototype.gasLimitChanged = function (newBN, valid) {
//   log.info(`Gas limit changed to ${newBN.toString(10)}`)
//   const txMeta = this.gatherTxMeta()
//   txMeta.txParams.gas = '0x' + newBN.toString('hex')
//   this.setState({
//     txData: clone(txMeta),
//     valid,
//   })
// }

// PendingTx.prototype.resetGasFields = function () {
//   log.debug(`pending-tx resetGasFields`)

//   this.inputs.forEach((hexInput) => {
//     if (hexInput) {
//       hexInput.setValid()
//     }
//   })

//   this.setState({
//     txData: null,
//     valid: true,
//   })
// }

PendingTx.prototype.onSubmit = function (event) {
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

PendingTx.prototype.checkValidity = function () {
  const form = this.getFormEl()
  const valid = form.checkValidity()
  return valid
}

PendingTx.prototype.getFormEl = function () {
  const form = document.querySelector('form#pending-tx-form')
  // Stub out form for unit tests:
  if (!form) {
    return { checkValidity () { return true } }
  }
  return form
}

// After a customizable state value has been updated,
PendingTx.prototype.gatherTxMeta = function () {
  log.debug(`pending-tx gatherTxMeta`)
  const props = this.props
  const state = this.state
  const txData = clone(state.txData) || clone(props.txData)

  log.debug(`UI has defaulted to tx meta ${JSON.stringify(txData)}`)
  return txData
}

PendingTx.prototype.verifyGasParams = function () {
  // We call this in case the gas has not been modified at all
  if (!this.state) { return true }
  return (
    this._notZeroOrEmptyString(this.state.gas) &&
    this._notZeroOrEmptyString(this.state.gasPrice)
  )
}

PendingTx.prototype._notZeroOrEmptyString = function (obj) {
  return obj !== '' && obj !== '0x0'
}

PendingTx.prototype.bnMultiplyByFraction = function (targetBN, numerator, denominator) {
  const numBN = new BN(numerator)
  const denomBN = new BN(denominator)
  return targetBN.mul(numBN).div(denomBN)
}
