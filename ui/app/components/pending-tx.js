const Component = require('react').Component
const { connect } = require('react-redux')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const actions = require('../actions')
const clone = require('clone')
const FiatValue = require('./fiat-value')
const Identicon = require('./identicon')
const { setCurrentCurrency } = require('../actions')

const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const hexToBn = require('../../../app/scripts/lib/hex-to-bn')
const util = require('../util')
const { conversionUtil } = require('../conversion-util')

const MIN_GAS_PRICE_GWEI_BN = new BN(1)
const GWEI_FACTOR = new BN(1e9)
const MIN_GAS_PRICE_BN = MIN_GAS_PRICE_GWEI_BN.mul(GWEI_FACTOR)

// Next: create separate react components
// roughly 5 components:
//   heroIcon
//   numericDisplay (contains symbol + currency)
//   divider
//   contentBox
//   actionButtons
const sectionDivider = h('div', {
  style: {
    height: '1px',
    background: '#E7E7E7',
    margin: 0,
    marginTop: '18px',
  },
})

const contentDivider = h('div', {
  style: {
    marginLeft: '16px',
    marginRight: '16px',
    height: '1.4px',
    background: '#E7E7E7',
  },
})

module.exports = connect(mapStateToProps, mapDispatchToProps)(PendingTx)

function mapStateToProps (state) {
  const {
    conversionRate,
    identities,
  } = state.metamask

  return {
    conversionRate,
    identities,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setCurrentCurrencyToUSD: () => dispatch(setCurrentCurrency('USD'))
  }
}

inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
  this.state = {
    valid: true,
    txData: null,
    submitting: false,
  }
}

PendingTx.prototype.componentWillMount = function () {
  this.props.setCurrentCurrencyToUSD()
}

PendingTx.prototype.render = function () {
  const props = this.props
  const { blockGasLimit, conversionRate, identities } = props

  const txMeta = this.gatherTxMeta()
  console.log(`txMeta`, txMeta);
  const txParams = txMeta.txParams || {}

  // Account Details
  const address = txParams.from || props.selectedAddress
  const account = props.accounts[address]
  const balance = account ? account.balance : '0x0'

  // recipient check
  const isValidAddress = !txParams.to || util.isValidAddress(txParams.to)

  // Gas
  const gas = txParams.gas
  const gasBn = hexToBn(gas)

  // Gas Price
  const gasPrice = txParams.gasPrice || MIN_GAS_PRICE_BN.toString(16)
  const gasPriceBn = hexToBn(gasPrice)

  const txFeeBn = gasBn.mul(gasPriceBn)

  const valueBn = hexToBn(txParams.value)
  const maxCost = txFeeBn.add(valueBn)

  const balanceBn = hexToBn(balance)
  const insufficientBalance = balanceBn.lt(maxCost)

  const fromName = identities[txParams.from].name;
  const toName = identities[txParams.to].name;

  const endOfFromAddress = txParams.from.slice(txParams.from.length - 4)
  const endOfToAddress = txParams.to.slice(txParams.to.length - 4)

  const gasFeeInUSD = conversionUtil(txFeeBn, {
    fromFormat: 'BN',
    fromCurrency: 'GWEI',
    toCurrency: 'USD',
    conversionRate,
  })
  const gasFeeInETH = conversionUtil(txFeeBn, {
    fromFormat: 'BN',
    fromCurrency: 'GWEI',
    toCurrency: 'ETH',
    conversionRate,
  })

  const totalInUSD = conversionUtil(hexToBn('0xa1'), {
    fromFormat: 'BN',
    toCurrency: 'USD',
    conversionRate,
  })
  const totalInETH = conversionUtil(hexToBn('0xa1'), {
    fromFormat: 'BN',
    toCurrency: 'ETH',
    conversionRate,
  })

  this.inputs = []

  return (
    h('div.flex-column.flex-grow', {
      style: {
        // overflow: 'scroll',
        minWidth: '355px', // TODO: maxWidth TBD, use home.html
      },
    }, [

      // Main Send token Card
      h('div.confirm-screen-wrapper.flex-column.flex-grow', {}, [

        h('h3.flex-center.confirm-screen-header', {}, [

          h('button.confirm-screen-back-button', {}, 'BACK'),

          h('div.confirm-screen-title', {}, 'Confirm Transaction'),
          
        ]),

        h('div.flex-row.flex-center.confirm-screen-identicons', {}, [

          h('div.confirm-screen-account-wrapper', {}, [
            h(
              Identicon,
              {
                address: txParams.from,
                diameter: 64,
                style: {},
              },
            ),
            h('span.confirm-screen-account-name', {}, fromName),
            h('span.confirm-screen-account-number', {}, endOfFromAddress),

          ]),

          h('i.fa.fa-arrow-right.fa-lg'),

          h('div.confirm-screen-account-wrapper', {}, [
            h(
              Identicon,
              {
                address: txParams.to,
                diameter: 64,
                style: {},
              },
            ),
            h('span.confirm-screen-account-name', {}, toName),
            h('span.confirm-screen-account-number', {}, endOfToAddress),
          ])

        ]),

        h('h3.flex-center.confirm-screen-sending-to-message', {
          style: {
            textAlign: 'center',
            fontSize: '12px',
          }
        }, [
          `You're sending to Recipient ...${endOfToAddress}`
        ]),

        h('h3.flex-center.confirm-screen-send-amount', {}, [`$${totalInUSD}`]),

        h('h3.flex-center.confirm-screen-send-amount-currency', {}, [
          'USD',
        ]),

        h('h3.flex-center.confirm-screen-send-memo', {}, [
          txParams.memo || 'Fake memo',
        ]),

        // error message
        props.error && h('span.error.flex-center', props.error),

        sectionDivider,

        h('section.flex-row.flex-center.confirm-screen-row', {
        }, [
          h('div', {
            style: {
              width: '50%',
            },
          }, [
            h('span.confirm-screen-label', {}, [
              'From',
            ]),
          ]),

          h('div', {
            style: {
              width: '50%',
            },
          }, [
            h('div.confirm-screen-account-name', {}, fromName),

            h('div.confirm-screen-account-number', {}, `...${endOfFromAddress}`),
          ]),
        ]),

        contentDivider,

        h('section.flex-row.flex-center.confirm-screen-row', {
        }, [
          h('div', {
            style: {
              width: '50%',
            },
          }, [
            h('span.confirm-screen-label', {}, [
              'To',
            ]),
          ]),

          h('div', {
            style: {
              width: '50%',
            },
          }, [
            h('div.confirm-screen-account-name', {}, toName),

            h('div.confirm-screen-account-number', {}, `...${endOfToAddress}`),
          ]),
        ]),

        contentDivider,

        h('section.flex-row.flex-center.confirm-screen-row', {
        }, [
          h('div', {
            style: {
              width: '50%',
            },
          }, [
            h('span.confirm-screen-label', {}, [
              'Gas Fee',
            ]),
          ]),

          h('div', {
            style: {
              width: '50%',
            },
          }, [
            h('div.confirm-screen-account-name', {}, `$${gasFeeInUSD} USD`),

            h('div.confirm-screen-account-number', {}, `${gasFeeInETH} ETH`),
          ]),
        ]),

        contentDivider,

        h('section.flex-row.flex-center.confirm-screen-total-box ', {}, [
          h('div', {
            style: {
              width: '50%',
            },
          }, [
            h('span.confirm-screen-label', {}, [
              'Total ',
            ]),

            h('div', {
              style: {
                textAlign: 'left',
                fontSize: '8px',
              },
            }, [
              'Amount + Gas',
            ]),

          ]),

          h('div', {
            style: {
              width: '50%',
            },
          }, [
            h('div.confirm-screen-account-name', {}, `$${totalInUSD} USD`),

            h('div.confirm-screen-account-number', {}, `${totalInETH} ETH`),
          ]),
        ]),

      ]), // end of container

      h('form#pending-tx-form.flex-column.flex-center', {
        onSubmit: this.onSubmit.bind(this),
      }, [
        // Reset Button
        // h('button', {
        //   onClick: (event) => {
        //     this.resetGasFields()
        //     event.preventDefault()
        //   },
        // }, 'Reset'),

        // Accept Button
        h('input.confirm-screen-confirm-button', {
          type: 'submit',
          value: 'CONFIRM',
          // disabled: insufficientBalance || !this.state.valid || !isValidAddress || this.state.submitting,
        }),

        // Cancel Button
        h('button.cancel.btn-light.confirm-screen-cancel-button', {}, 'CANCEL'),
      ]),
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
