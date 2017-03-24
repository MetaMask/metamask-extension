const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const extend = require('xtend')
const actions = require('../actions')

const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

const MiniAccountPanel = require('./mini-account-panel')
const EthBalance = require('./eth-balance')
const util = require('../util')
const addressSummary = util.addressSummary
const nameForAddress = require('../../lib/contract-namer')
const HexInput = require('./hex-as-decimal-input')

const MIN_GAS_PRICE_BN = new BN(20000000)
const MIN_GAS_LIMIT_BN = new BN(21000)

module.exports = connect(mapStateToProps)(PendingTx)

function mapStateToProps (state) {
  return {}
}

inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
  this.state = {
    valid: true,
    gas: null,
    gasPrice: null,
    txData: null,
  }
}

PendingTx.prototype.render = function () {
  const props = this.props
  const state = this.state

  const txData = state.txData || props.txData
  const txParams = txData.txParams || {}

  const address = txParams.from || props.selectedAddress
  const identity = props.identities[address] || { address: address }
  const account = props.accounts[address]
  const balance = account ? account.balance : '0x0'

  const gas = state.gas || txParams.gas
  const gasPrice = state.gasPrice || txData.gasPrice
  const gasBn = new BN(gas, 16)
  const gasPriceBn = new BN(gasPrice, 16)

  const txFeeBn = gasBn.mul(gasPriceBn)
  const valueBn = new BN(ethUtil.stripHexPrefix(txParams.value), 16)
  const maxCost = txFeeBn.add(valueBn)

  const dataLength = txParams.data ? (txParams.data.length - 2) / 2 : 0
  const imageify = props.imageifyIdenticons === undefined ? true : props.imageifyIdenticons

  this.inputs = []

  return (

    h('div', {
      key: txData.id,
    }, [

      h('form#pending-tx-form', {
        onSubmit: (event) => {
          event.preventDefault()
          const form = document.querySelector('form#pending-tx-form')
          const valid = form.checkValidity()
          this.setState({ valid })

          if (valid && this.verifyGasParams()) {
            props.sendTransaction(txData, event)
          } else {
            this.props.dispatch(actions.displayWarning('Invalid Gas Parameters'))
          }
        },
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
              imageifyIdenticons: imageify,
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
              h(EthBalance, { value: txParams.value }),
            ]),

            // Gas Limit (customizable)
            h('.cell.row', [
              h('.cell.label', 'Gas Limit'),
              h('.cell.value', {
              }, [
                h(HexInput, {
                  name: 'Gas Limit',
                  value: gas,
                  min: MIN_GAS_LIMIT_BN.toString(10), // The hard lower limit for gas.
                  suffix: 'UNITS',
                  style: {
                    position: 'relative',
                    top: '5px',
                  },
                  onChange: (newHex) => {
                    log.info(`Gas limit changed to ${newHex}`)
                    this.setState({ gas: newHex })
                  },
                  ref: (hexInput) => { this.inputs.push(hexInput) },
                }),
              ]),
            ]),

            // Gas Price (customizable)
            h('.cell.row', [
              h('.cell.label', 'Gas Price'),
              h('.cell.value', {
              }, [
                h(HexInput, {
                  name: 'Gas Price',
                  value: gasPrice,
                  suffix: 'WEI',
                  min: MIN_GAS_PRICE_BN.toString(10),
                  style: {
                    position: 'relative',
                    top: '5px',
                  },
                  onChange: (newHex) => {
                    log.info(`Gas price changed to: ${newHex}`)
                    this.setState({ gasPrice: newHex })
                  },
                  ref: (hexInput) => { this.inputs.push(hexInput) },
                }),
              ]),
            ]),

            // Max Transaction Fee (calculated)
            h('.cell.row', [
              h('.cell.label', 'Max Transaction Fee'),
              h(EthBalance, { value: txFeeBn.toString(16) }),
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

        txData.simulationFails ?
          h('.error', {
            style: {
              marginLeft: 50,
              fontSize: '0.9em',
            },
          }, 'Transaction Error. Exception thrown in contract code.')
        : null,

        props.insufficientBalance ?
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


          props.insufficientBalance ?
            h('button', {
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
            disabled: props.insufficientBalance || !this.state.valid,
          }),

          h('button.cancel.btn-red', {
            onClick: props.cancelTransaction,
          }, 'Reject'),
        ]),
      ]),
    ])
  )
}

PendingTx.prototype.validChanged = function (newValid) {
  this.setState({ valid: newValid })
}

PendingTx.prototype.miniAccountPanelForRecipient = function () {
  const props = this.props
  const txData = props.txData
  const txParams = txData.txParams || {}
  const isContractDeploy = !('to' in txParams)
  const imageify = props.imageifyIdenticons === undefined ? true : props.imageifyIdenticons

  // If it's not a contract deploy, send to the account
  if (!isContractDeploy) {
    return h(MiniAccountPanel, {
      imageSeed: txParams.to,
      imageifyIdenticons: imageify,
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
      imageifyIdenticons: imageify,
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

PendingTx.prototype.componentDidUpdate = function (prevProps, previousState) {
  log.debug(`pending-tx componentDidUpdate`)
  const state = this.state || {}
  const prevState = previousState || {}
  const { gas, gasPrice } = state

  // Only if gas or gasPrice changed:
  if (!prevState ||
      (gas !== prevState.gas ||
      gasPrice !== prevState.gasPrice)) {
    log.debug(`recalculating gas since prev state change: ${JSON.stringify({ prevState, state })}`)
    this.calculateGas()
  }
}

PendingTx.prototype.calculateGas = function () {
  const state = this.state
  const props = this.props
  const txData = props.txData

  const txMeta = this.gatherParams()
  log.debug(`pending-tx calculating gas for ${JSON.stringify(txMeta)}`)

  const txParams = txMeta.txParams
  const gasLimit = new BN(ethUtil.stripHexPrefix(txParams.gas || txMeta.estimatedGas), 16)
  const gasPriceHex = state.gasPrice || txData.gasPrice
  const gasPrice = new BN(ethUtil.stripHexPrefix(gasPriceHex), 16)

  const valid = !gasPrice.lt(MIN_GAS_PRICE_BN) && !gasLimit.lt(MIN_GAS_LIMIT_BN)
  this.validChanged(valid)

  const txFee = gasLimit.mul(gasPrice)
  const txValue = new BN(ethUtil.stripHexPrefix(txParams.value || '0x0'), 16)
  const maxCost = txValue.add(txFee)

  const txFeeHex = '0x' + txFee.toString('hex')
  const maxCostHex = '0x' + maxCost.toString('hex')

  txMeta.txFee = txFeeHex
  txMeta.maxCost = maxCostHex
  txMeta.txParams.gasPrice = gasPriceHex

  const newState = {
    txFee: '0x' + txFee.toString('hex'),
    maxCost: '0x' + maxCost.toString('hex'),
  }
  log.info(`tx form updating local state with ${JSON.stringify(newState)}`)
  this.setState(newState)

  if (this.props.onTxChange) {
    this.props.onTxChange(txMeta)
  }
}

PendingTx.prototype.resetGasFields = function () {
  log.debug(`pending-tx resetGasFields`)
  const txData = this.props.txData

  this.inputs.forEach((hexInput) => {
    if (hexInput) {
      hexInput.setValid()
    }
  })

  this.setState({
    gas: txData.txParams.gas,
    gasPrice: txData.gasPrice,
    valid: true,
  })
}

// After a customizable state value has been updated,
PendingTx.prototype.gatherParams = function () {
  log.debug(`pending-tx gatherParams`)
  const props = this.props
  const state = this.state || {}
  const txData = state.txData || props.txData
  const txParams = txData.txParams
  const gas = state.gas || txParams.gas
  const gasPrice = state.gasPrice || txParams.gasPrice
  const resultTx = extend(txParams, {
    gas,
    gasPrice,
  })
  const resultTxMeta = extend(txData, {
    txParams: resultTx,
  })
  log.debug(`UI has computed tx params ${JSON.stringify(resultTx)}`)
  return resultTxMeta
}

PendingTx.prototype.verifyGasParams = function () {
  // We call this in case the gas has not been modified at all
  if (!this.state) { return true }
  return this._notZeroOrEmptyString(this.state.gas) && this._notZeroOrEmptyString(this.state.gasPrice)
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

