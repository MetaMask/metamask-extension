const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const actions = require('../actions')

const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const hexToBn = require('../../../app/scripts/lib/hex-to-bn')

const MiniAccountPanel = require('./mini-account-panel')
const EthBalance = require('./eth-balance')
const util = require('../util')
const addressSummary = util.addressSummary
const nameForAddress = require('../../lib/contract-namer')
const BNInput = require('./bn-as-decimal-input')

const MIN_GAS_PRICE_GWEI_BN = new BN(2)
const GWEI_FACTOR = new BN(1e9)
const MIN_GAS_PRICE_BN = MIN_GAS_PRICE_GWEI_BN.mul(GWEI_FACTOR)
const MIN_GAS_LIMIT_BN = new BN(21000)

module.exports = PendingTx
inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
  this.state = {
    valid: true,
    txData: null,
  }
}

PendingTx.prototype.render = function () {
  const props = this.props
  const { currentCurrency } = props

  const conversionRate = props.conversionRate
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  // Account Details
  const address = txParams.from || props.selectedAddress
  const identity = props.identities[address] || { address: address }
  const account = props.accounts[address]
  const balance = account ? account.balance : '0x0'

  // Gas
  const gas = txParams.gas
  const gasBn = hexToBn(gas)

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

    h('div', {
      key: txMeta.id,
    }, [

      h('form#pending-tx-form', {
        onSubmit: this.onSubmit.bind(this),

      }, [

        // tx info
        h('div', [

          h('.flex-row.flex-center', {
            style: {
              maxWidth: '100%',
            },
          }, [

            h(MiniAccountPanel, {
              imageSeed: address,
              picOrder: 'right',
            }, [
              h('span.font-small', {
                style: {
                  fontFamily: 'Montserrat Bold, Montserrat, sans-serif',
                },
              }, identity.name),
              h('span.font-small', {
                style: {
                  fontFamily: 'Montserrat Light, Montserrat, sans-serif',
                },
              }, addressSummary(address, 6, 4, false)),

              h('span.font-small', {
                style: {
                  fontFamily: 'Montserrat Light, Montserrat, sans-serif',
                },
              }, [
                h(EthBalance, {
                  value: balance,
                  conversionRate,
                  currentCurrency,
                  inline: true,
                  labelColor: '#F7861C',
                }),
              ]),
            ]),

            forwardCarrat(),

            this.miniAccountPanelForRecipient(),
          ]),

          h('style', `
            .table-box {
              margin: 7px 0px 0px 0px;
              width: 100%;
            }
            .table-box .row {
              margin: 0px;
              background: rgb(236,236,236);
              display: flex;
              justify-content: space-between;
              font-family: Montserrat Light, sans-serif;
              font-size: 13px;
              padding: 5px 25px;
            }
            .table-box .row .value {
              font-family: Montserrat Regular;
            }
          `),

          h('.table-box', [

            // Ether Value
            // Currently not customizable, but easily modified
            // in the way that gas and gasLimit currently are.
            h('.row', [
              h('.cell.label', 'Amount'),
              h(EthBalance, { value: txParams.value, currentCurrency, conversionRate }),
            ]),

            // Gas Limit (customizable)
            h('.cell.row', [
              h('.cell.label', 'Gas Limit'),
              h('.cell.value', {
              }, [
                h(BNInput, {
                  name: 'Gas Limit',
                  value: gasBn,
                  precision: 0,
                  // The hard lower limit for gas.
                  min: MIN_GAS_LIMIT_BN.toString(10),
                  suffix: 'UNITS',
                  style: {
                    position: 'relative',
                    top: '5px',
                  },
                  onChange: this.gasLimitChanged.bind(this),

                  ref: (hexInput) => { this.inputs.push(hexInput) },
                }),
              ]),
            ]),

            // Gas Price (customizable)
            h('.cell.row', [
              h('.cell.label', 'Gas Price'),
              h('.cell.value', {
              }, [
                h(BNInput, {
                  name: 'Gas Price',
                  value: gasPriceBn,
                  precision: 9,
                  suffix: 'GWEI',
                  min: MIN_GAS_PRICE_GWEI_BN.toString(10),
                  style: {
                    position: 'relative',
                    top: '5px',
                  },
                  onChange: this.gasPriceChanged.bind(this),
                  ref: (hexInput) => { this.inputs.push(hexInput) },
                }),
              ]),
            ]),

            // Max Transaction Fee (calculated)
            h('.cell.row', [
              h('.cell.label', 'Max Transaction Fee'),
              h(EthBalance, { value: txFeeBn.toString(16), currentCurrency, conversionRate }),
            ]),

            h('.cell.row', {
              style: {
                fontFamily: 'Montserrat Regular',
                background: 'white',
                padding: '10px 25px',
              },
            }, [
              h('.cell.label', 'Max Total'),
              h('.cell.value', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                },
              }, [
                h(EthBalance, {
                  value: maxCost.toString(16),
                  currentCurrency,
                  conversionRate,
                  inline: true,
                  labelColor: 'black',
                  fontSize: '16px',
                }),
              ]),
            ]),

            // Data size row:
            h('.cell.row', {
              style: {
                background: '#f7f7f7',
                paddingBottom: '0px',
              },
            }, [
              h('.cell.label'),
              h('.cell.value', {
                style: {
                  fontFamily: 'Montserrat Light',
                  fontSize: '11px',
                },
              }, `Data included: ${dataLength} bytes`),
            ]),
          ]), // End of Table

        ]),

        h('style', `
          .conf-buttons button {
            margin-left: 10px;
            text-transform: uppercase;
          }
        `),

        txMeta.simulationFails ?
          h('.error', {
            style: {
              marginLeft: 50,
              fontSize: '0.9em',
            },
          }, 'Transaction Error. Exception thrown in contract code.')
        : null,

        insufficientBalance ?
          h('span.error', {
            style: {
              marginLeft: 50,
              fontSize: '0.9em',
            },
          }, 'Insufficient balance for transaction')
        : null,

        // send + cancel
        h('.flex-row.flex-space-around.conf-buttons', {
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            margin: '14px 25px',
          },
        }, [


          insufficientBalance ?
            h('button.btn-green', {
              onClick: props.buyEth,
            }, 'Buy Ether')
          : null,

          h('button', {
            onClick: (event) => {
              this.resetGasFields()
              event.preventDefault()
            },
          }, 'Reset'),

          // Accept Button
          h('input.confirm.btn-green', {
            type: 'submit',
            value: 'ACCEPT',
            style: { marginLeft: '10px' },
            disabled: insufficientBalance || !this.state.valid,
          }),

          h('button.cancel.btn-red', {
            onClick: props.cancelTransaction,
          }, 'Reject'),
        ]),
      ]),
    ])
  )
}

PendingTx.prototype.miniAccountPanelForRecipient = function () {
  const props = this.props
  const txData = props.txData
  const txParams = txData.txParams || {}
  const isContractDeploy = !('to' in txParams)

  // If it's not a contract deploy, send to the account
  if (!isContractDeploy) {
    return h(MiniAccountPanel, {
      imageSeed: txParams.to,
      picOrder: 'left',
    }, [
      h('span.font-small', {
        style: {
          fontFamily: 'Montserrat Bold, Montserrat, sans-serif',
        },
      }, nameForAddress(txParams.to, props.identities)),
      h('span.font-small', {
        style: {
          fontFamily: 'Montserrat Light, Montserrat, sans-serif',
        },
      }, addressSummary(txParams.to, 6, 4, false)),
    ])
  } else {
    return h(MiniAccountPanel, {
      picOrder: 'left',
    }, [

      h('span.font-small', {
        style: {
          fontFamily: 'Montserrat Bold, Montserrat, sans-serif',
        },
      }, 'New Contract'),

    ])
  }
}

PendingTx.prototype.gasPriceChanged = function (newBN) {
  log.info(`Gas price changed to: ${newBN.toString(10)}`)
  const txMeta = this.gatherTxMeta()
  txMeta.txParams.gasPrice = '0x' + newBN.toString('hex')
  this.setState({ txData: cloneObj(txMeta) })
}

PendingTx.prototype.gasLimitChanged = function (newBN) {
  log.info(`Gas limit changed to ${newBN.toString(10)}`)
  const txMeta = this.gatherTxMeta()
  txMeta.txParams.gas = '0x' + newBN.toString('hex')
  this.setState({ txData: cloneObj(txMeta) })
}

PendingTx.prototype.resetGasFields = function () {

  log.debug(`pending-tx resetGasFields`)

  this.inputs.forEach((hexInput) => {
    if (hexInput) {
      hexInput.setValid()
    }
  })

  this.setState({
    txData: null,
    valid: true,
  })
}

PendingTx.prototype.onSubmit = function (event) {
  event.preventDefault()
  const txMeta = this.gatherTxMeta()
  const valid = this.checkValidity()
  this.setState({ valid })
  if (valid && this.verifyGasParams()) {
    this.props.sendTransaction(txMeta, event)
  } else {
    this.props.dispatch(actions.displayWarning('Invalid Gas Parameters'))
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
  const txData = cloneObj(state.txData) || cloneObj(props.txData)

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

function forwardCarrat () {
  return (
    h('img', {
      src: 'images/forward-carrat.svg',
      style: {
        padding: '5px 6px 0px 10px',
        height: '37px',
      },
    })
  )
}

function cloneObj (obj) {
  return JSON.parse(JSON.stringify(obj))
}
