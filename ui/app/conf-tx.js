const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')
const NetworkIndicator = require('./components/network')
const txHelper = require('../lib/tx-helper')
const isPopupOrNotification = require('../../app/scripts/lib/is-popup-or-notification')

const PendingTx = require('./components/pending-tx')
const PendingMsg = require('./components/pending-msg')
const PendingPersonalMsg = require('./components/pending-personal-msg')
const Loading = require('./components/loading')

module.exports = connect(mapStateToProps)(ConfirmTxScreen)

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    selectedAddress: state.metamask.selectedAddress,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: state.metamask.unapprovedPersonalMsgs,
    index: state.appState.currentView.context,
    warning: state.appState.warning,
    network: state.metamask.network,
    provider: state.metamask.provider,
    conversionRate: state.metamask.conversionRate,
    currentCurrency: state.metamask.currentCurrency,
    blockGasLimit: state.metamask.currentBlockGasLimit,
  }
}

inherits(ConfirmTxScreen, Component)
function ConfirmTxScreen () {
  Component.call(this)
}

ConfirmTxScreen.prototype.render = function () {
  const props = this.props
  const { network, provider, unapprovedTxs, currentCurrency,
    unapprovedMsgs, unapprovedPersonalMsgs, conversionRate, blockGasLimit } = props

  var unconfTxList = txHelper(unapprovedTxs, unapprovedMsgs, unapprovedPersonalMsgs, network)

  var txData = unconfTxList[props.index] || {}
  var txParams = txData.params || {}
  var isNotification = isPopupOrNotification() === 'notification'


  log.info(`rendering a combined ${unconfTxList.length} unconf msg & txs`)
  if (unconfTxList.length === 0) return h(Loading, { isLoading: true })

  return currentTxView({
    // Properties
    txData: txData,
    key: txData.id,
    selectedAddress: props.selectedAddress,
    accounts: props.accounts,
    identities: props.identities,
    conversionRate,
    currentCurrency,
    blockGasLimit,
    // Actions
    buyEth: this.buyEth.bind(this, txParams.from || props.selectedAddress),
    sendTransaction: this.sendTransaction.bind(this),
    cancelTransaction: this.cancelTransaction.bind(this, txData),
    signMessage: this.signMessage.bind(this, txData),
    signPersonalMessage: this.signPersonalMessage.bind(this, txData),
    cancelMessage: this.cancelMessage.bind(this, txData),
    cancelPersonalMessage: this.cancelPersonalMessage.bind(this, txData),
  })
}

function currentTxView (opts) {
  log.info('rendering current tx view')
  const { txData } = opts
  const { txParams, msgParams, type } = txData

  if (txParams) {
    log.debug('txParams detected, rendering pending tx')
    return h(PendingTx, opts)
  } else if (msgParams) {
    log.debug('msgParams detected, rendering pending msg')

    if (type === 'eth_sign') {
      log.debug('rendering eth_sign message')
      return h(PendingMsg, opts)
    } else if (type === 'personal_sign') {
      log.debug('rendering personal_sign message')
      return h(PendingPersonalMsg, opts)
    }
  }
}

ConfirmTxScreen.prototype.buyEth = function (address, event) {
  event.preventDefault()
  this.props.dispatch(actions.buyEthView(address))
}

ConfirmTxScreen.prototype.sendTransaction = function (txData, event) {
  this.stopPropagation(event)
  this.props.dispatch(actions.updateAndApproveTx(txData))
}

ConfirmTxScreen.prototype.cancelTransaction = function (txData, event) {
  this.stopPropagation(event)
  event.preventDefault()
  this.props.dispatch(actions.cancelTx(txData))
}

ConfirmTxScreen.prototype.signMessage = function (msgData, event) {
  log.info('conf-tx.js: signing message')
  var params = msgData.msgParams
  params.metamaskId = msgData.id
  this.stopPropagation(event)
  this.props.dispatch(actions.signMsg(params))
}

ConfirmTxScreen.prototype.stopPropagation = function (event) {
  if (event.stopPropagation) {
    event.stopPropagation()
  }
}

ConfirmTxScreen.prototype.signPersonalMessage = function (msgData, event) {
  log.info('conf-tx.js: signing personal message')
  var params = msgData.msgParams
  params.metamaskId = msgData.id
  this.stopPropagation(event)
  this.props.dispatch(actions.signPersonalMsg(params))
}

ConfirmTxScreen.prototype.cancelMessage = function (msgData, event) {
  log.info('canceling message')
  this.stopPropagation(event)
  this.props.dispatch(actions.cancelMsg(msgData))
}

ConfirmTxScreen.prototype.cancelPersonalMessage = function (msgData, event) {
  log.info('canceling personal message')
  this.stopPropagation(event)
  this.props.dispatch(actions.cancelPersonalMsg(msgData))
}

ConfirmTxScreen.prototype.goHome = function (event) {
  this.stopPropagation(event)
  this.props.dispatch(actions.goHome())
}

function warningIfExists (warning) {
  if (warning &&
     // Do not display user rejections on this screen:
     warning.indexOf('User denied transaction signature') === -1) {
    return h('.error', {
      style: {
        margin: 'auto',
      },
    }, warning)
  }
}
