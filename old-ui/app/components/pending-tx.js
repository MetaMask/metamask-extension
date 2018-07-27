const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const actions = require('../../../ui/app/actions')
const clone = require('clone')
const log = require('loglevel')

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
const { getEnvironmentType } = require('../../../app/scripts/lib/util')
const NetworkIndicator = require('../components/network')
const { ENVIRONMENT_TYPE_NOTIFICATION } = require('../../../app/scripts/lib/enums')
const connect = require('react-redux').connect

const MIN_GAS_PRICE_BN = new BN('0')
const MIN_GAS_LIMIT_BN = new BN('21000')

module.exports = connect(mapStateToProps)(PendingTx)
inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
  this.state = {
    valid: true,
    txData: null,
    submitting: false,
  }
}

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    selectedAddress: state.metamask.selectedAddress,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: state.metamask.unapprovedPersonalMsgs,
    unapprovedTypedMessages: state.metamask.unapprovedTypedMessages,
    index: state.appState.currentView.context,
    warning: state.appState.warning,
    network: state.metamask.network,
    provider: state.metamask.provider,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
    blockGasLimit: state.metamask.currentBlockGasLimit,
    computedBalances: state.metamask.computedBalances,
  }
}

PendingTx.prototype.render = function () {
  const props = this.props
  const { currentCurrency, blockGasLimit, network, provider } = props

  const conversionRate = props.conversionRate
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  // Allow retry txs
  const { lastGasPrice } = txMeta
  let forceGasMin
  if (lastGasPrice) {
    const stripped = ethUtil.stripHexPrefix(lastGasPrice)
    const lastGas = new BN(stripped, 16)
    const priceBump = lastGas.divn('10')
    forceGasMin = lastGas.add(priceBump)
  }

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
  // default to 8MM gas limit
  const gasLimit = new BN(parseInt(blockGasLimit) || '8000000')
  const safeGasLimitBN = this.bnMultiplyByFraction(gasLimit, 99, 100)
  const saferGasLimitBN = this.bnMultiplyByFraction(gasLimit, 98, 100)
  const safeGasLimit = safeGasLimitBN.toString(10)

  // Gas Price
  const gasPrice = txParams.gasPrice || MIN_GAS_PRICE_BN.toString(16)
  const gasPriceBn = hexToBn(gasPrice)

  const txFeeBn = gasBn.mul(gasPriceBn)
  const valueBn = hexToBn(txParams.value)
  const maxCost = txFeeBn.add(valueBn)

  const dataLength = txParams.data ? (txParams.data.length - 2) / 2 : 0

  const balanceBn = hexToBn(balance)
  const insufficientBalance = balanceBn.lt(maxCost)
  const dangerousGasLimit = gasBn.gte(saferGasLimitBN)
  const gasLimitSpecified = txMeta.gasLimitSpecified
  const buyDisabled = insufficientBalance || !this.state.valid || !isValidAddress || this.state.submitting
  const showRejectAll = props.unconfTxListLength > 1

  var isNotification = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION

  this.inputs = []

  const valueStyle = {
    fontFamily: 'Nunito-Bold',
    width: '100%',
    textAlign: 'right',
    fontSize: '14px',
    color: '#333333',
  }

  const dimStyle = {
    color: '#333333',
    marginLeft: '5px',
    fontSize: '14px',
  }

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
              padding: '20px 20px',
              background: 'linear-gradient(rgb(84, 36, 147), rgb(104, 45, 182))',
            },
          }, [

            h(MiniAccountPanel, {
              imageSeed: address,
              picOrder: 'right',
            }, [
              h('span.font-small', {
                style: {
                  fontFamily: 'Nunito Bold, Nunito, sans-serif',
                  color: '#ffffff',
                },
              }, identity.name),

              h(Copyable, {
                value: ethUtil.toChecksumAddress(address),
              }, [
                h('span.font-small', {
                  style: {
                    fontFamily: 'Nunito Light, Nunito, sans-serif',
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }, addressSummary(address, 6, 4, false)),
              ]),

              h('span.font-small', {
                style: {
                  fontFamily: 'Nunito Light, Nunito, sans-serif',
                },
              }, [
                h(EthBalance, {
                  value: balance,
                  conversionRate,
                  currentCurrency,
                  network,
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
              background: #ffffff;
              display: flex;
              justify-content: space-between;
              font-family: Nunito Light, sans-serif;
              font-size: 13px;
              padding: 5px 25px;
            }
            .table-box .row .value {
              font-family: Nunito Regular;
            }
          `),

          h('.table-box', [

            h('.section-title.flex-row.flex-center', [
              !isNotification ? h('i.fa.fa-arrow-left.fa-lg.cursor-pointer.color-violet', {
                onClick: this.goHome.bind(this),
                style: {
                  position: 'absolute',
                  left: '33px',
                }
              }) : null,
              h('h2.page-subtitle', 'Confirm Transaction'),
              isNotification ? h(NetworkIndicator, {
                network: network,
                provider: provider,
              }) : null,
            ]),

            // Ether Value
            // Currently not customizable, but easily modified
            // in the way that gas and gasLimit currently are.
            h('.row', [
              h('.cell.label', 'Amount'),
              h(EthBalance, { valueStyle, dimStyle, value: txParams.value, currentCurrency, conversionRate, network }),
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
                  scale: 0,
                  // The hard lower limit for gas.
                  min: MIN_GAS_LIMIT_BN,
                  max: safeGasLimit,
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
                  scale: 9,
                  suffix: 'GWEI',
                  min: forceGasMin || MIN_GAS_PRICE_BN,
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
              h(EthBalance, { valueStyle, dimStyle, value: txFeeBn.toString(16), currentCurrency, conversionRate, network }),
            ]),

            h('.cell.row', {
              style: {
                fontFamily: 'Nunito Regular',
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
                  valueStyle,
                  dimStyle,
                  value: maxCost.toString(16),
                  currentCurrency,
                  conversionRate,
                  inline: true,
                  network,
                  labelColor: 'black',
                  fontSize: '16px',
                }),
              ]),
            ]),

            // Data size row:
            h('.cell.row', {
              style: {
                background: '#ffffff',
                paddingBottom: '0px',
              },
            }, [
              h('.cell.label'),
              h('.cell.value', {
                style: {
                  fontFamily: 'Nunito Light',
                  fontSize: '11px',
                },
              }, `Data included: ${dataLength} bytes`),
            ]),
          ]), // End of Table

        ]),

        h('style', `
          .conf-buttons button {
            margin-left: 10px;
          }
        `),
        h('.cell.row', {
          style: {
            textAlign: 'center',
          },
        }, [
          txMeta.simulationFails ?
            h('.error', {
              style: {
                fontSize: '0.9em',
              },
            }, 'Transaction Error. Exception thrown in contract code.')
          : null,

          !isValidAddress ?
            h('.error', {
              style: {
                fontSize: '0.9em',
              },
            }, 'Recipient address is invalid. Sending this transaction will result in a loss of ETH.')
          : null,

          insufficientBalance ?
            h('span.error', {
              style: {
                fontSize: '0.9em',
              },
            }, 'Insufficient balance for transaction')
          : null,

          (dangerousGasLimit && !gasLimitSpecified) ?
            h('span.error', {
              style: {
                fontSize: '0.9em',
              },
            }, 'Gas limit set dangerously high. Approving this transaction is liable to fail.')
          : null,
        ]),


        // send + cancel
        h('.flex-row.flex-space-around.conf-buttons', {
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            margin: '14px 25px',
          },
        }, [
          h('button.btn-violet', {
            onClick: (event) => {
              this.resetGasFields()
              event.preventDefault()
            },
          }, 'Reset'),

          // Accept Button or Buy Button
          insufficientBalance ? h('button.btn-green', { onClick: props.buyEth }, 'Buy Ether') :
            h('input.confirm', {
              type: 'submit',
              value: 'Submit',
              style: { marginLeft: '10px' },
              disabled: buyDisabled,
            }),

          h('button.cancel.btn-red', {
            onClick: props.cancelTransaction,
          }, 'Reject'),
        ]),
        showRejectAll ? h('.flex-row.flex-space-around.conf-buttons', {
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            margin: '14px 25px',
          },
        }, [
          h('button.cancel.btn-red', {
            onClick: props.cancelAllTransactions,
          }, 'Reject All'),
        ]) : null,
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
          fontFamily: 'Nunito Bold, Nunito, sans-serif',
          color: '#ffffff',
        },
      }, nameForAddress(txParams.to, props.identities)),

      h(Copyable, {
        value: ethUtil.toChecksumAddress(txParams.to),
      }, [
        h('span.font-small', {
          style: {
            fontFamily: 'Nunito Light, Nunito, sans-serif',
            color: 'rgba(255, 255, 255, 0.7)',
          },
        }, addressSummary(txParams.to, 6, 4, false)),
      ]),

    ])
  } else {
    return h(MiniAccountPanel, {
      picOrder: 'left',
    }, [

      h('span.font-small', {
        style: {
          fontFamily: 'Nunito Bold, Nunito, sans-serif',
        },
      }, 'New Contract'),

    ])
  }
}

PendingTx.prototype.gasPriceChanged = function (newBN, valid) {
  log.info(`Gas price changed to: ${newBN.toString(10)}`)
  const txMeta = this.gatherTxMeta()
  txMeta.txParams.gasPrice = '0x' + newBN.toString('hex')
  this.setState({
    txData: clone(txMeta),
    valid,
  })
}

PendingTx.prototype.gasLimitChanged = function (newBN, valid) {
  log.info(`Gas limit changed to ${newBN.toString(10)}`)
  const txMeta = this.gatherTxMeta()
  txMeta.txParams.gas = '0x' + newBN.toString('hex')
  this.setState({
    txData: clone(txMeta),
    valid,
  })
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

PendingTx.prototype.goHome = function (event) {
  this.stopPropagation(event)
  this.props.dispatch(actions.goHome())
}

PendingTx.prototype.stopPropagation = function (event) {
  if (event.stopPropagation) {
    event.stopPropagation()
  }
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
