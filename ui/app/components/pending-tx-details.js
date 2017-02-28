const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const extend = require('xtend')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

const MiniAccountPanel = require('./mini-account-panel')
const EthBalance = require('./eth-balance')
const util = require('../util')
const addressSummary = util.addressSummary
const nameForAddress = require('../../lib/contract-namer')
const HexInput = require('./hex-as-decimal-input')


module.exports = PendingTxDetails

inherits(PendingTxDetails, Component)
function PendingTxDetails () {
  Component.call(this)
}

const PTXP = PendingTxDetails.prototype

PTXP.render = function () {
  var props = this.props
  var state = this.state || {}
  var txData = state.txMeta || props.txData

  var txParams = txData.txParams || {}
  var address = txParams.from || props.selectedAddress
  var identity = props.identities[address] || { address: address }
  var account = props.accounts[address]
  var balance = account ? account.balance : '0x0'

  const gas = state.gas || txParams.gas
  const gasPrice = state.gasPrice || txData.gasPrice

  var txFee = state.txFee || txData.txFee || ''
  var maxCost = state.maxCost || txData.maxCost || ''
  var dataLength = txParams.data ? (txParams.data.length - 2) / 2 : 0
  var imageify = props.imageifyIdenticons === undefined ? true : props.imageifyIdenticons
  var advanced = state.advanced || false

  log.debug(`rendering gas: ${gas}, gasPrice: ${gasPrice}, txFee: ${txFee}, maxCost: ${maxCost}`)

  return (
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

        h('.row', [
          h('.cell.label', 'Advanced Options'),
          h('input', {
            type: 'checkbox',
            selected: advanced,
            onChange: () => {
              this.setState({advanced: !advanced})
            }
          })
        ]),

        // Ether Value
        // Currently not customizable, but easily modified
        // in the way that gas and gasLimit currently are.
        h('.row', [
          h('.cell.label', 'Amount'),
          h(EthBalance, { value: txParams.value }),
        ]),

        // Gas Limit (customizable)
        advanced ? h('.cell.row', [
          h('.cell.label', 'Gas Limit'),
          h('.cell.value', {
          }, [
            h(HexInput, {
              value: gas,
              suffix: 'UNITS',
              style: {
                position: 'relative',
                top: '5px',
              },
              onChange: (newHex) => {
                log.info(`Gas limit changed to ${newHex}`)
                this.setState({ gas: newHex })
              },
            }),
          ]),
        ]) : null,

        // Gas Price (customizable)
        advanced ? h('.cell.row', [
          h('.cell.label', 'Gas Price'),
          h('.cell.value', {
          }, [
            h(HexInput, {
              value: gasPrice,
              suffix: 'WEI',
              style: {
                position: 'relative',
                top: '5px',
              },
              onChange: (newHex) => {
                log.info(`Gas price changed to: ${newHex}`)
                this.setState({ gasPrice: newHex })
              },
            }),
          ]),
        ]) : null,

        // Max Transaction Fee (calculated)
        h('.cell.row', [
          h('.cell.label', 'Max Transaction Fee'),
          h(EthBalance, { value: txFee.toString(16) }),
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

    ])
  )
}

PTXP.miniAccountPanelForRecipient = function () {
  var props = this.props
  var txData = props.txData
  var txParams = txData.txParams || {}
  var isContractDeploy = !('to' in txParams)
  var imageify = props.imageifyIdenticons === undefined ? true : props.imageifyIdenticons

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

PTXP.componentDidUpdate = function (prevProps, previousState) {
  log.debug(`pending-tx-details componentDidUpdate`)
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

PTXP.calculateGas = function () {
  const txMeta = this.gatherParams()
  log.debug(`pending-tx-details calculating gas for ${JSON.stringify(txMeta)}`)

  var txParams = txMeta.txParams
  var gasCost = new BN(ethUtil.stripHexPrefix(txParams.gas || txMeta.estimatedGas), 16)
  var gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice || '0x4a817c800'), 16)
  var txFee = gasCost.mul(gasPrice)
  var txValue = new BN(ethUtil.stripHexPrefix(txParams.value || '0x0'), 16)
  var maxCost = txValue.add(txFee)

  const txFeeHex = '0x' + txFee.toString('hex')
  const maxCostHex = '0x' + maxCost.toString('hex')
  const gasPriceHex = '0x' + gasPrice.toString('hex')

  txMeta.txFee = txFeeHex
  txMeta.maxCost = maxCostHex
  txMeta.txParams.gasPrice = gasPriceHex

  this.setState({
    txFee: '0x' + txFee.toString('hex'),
    maxCost: '0x' + maxCost.toString('hex'),
  })

  if (this.props.onTxChange) {
    this.props.onTxChange(txMeta)
  }
}

// After a customizable state value has been updated,
PTXP.gatherParams = function () {
  log.debug(`pending-tx-details#gatherParams`)
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
  return resultTxMeta
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
