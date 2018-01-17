const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')
const txHelper = require('../lib/tx-helper')

const PendingTx = require('./components/pending-tx')
const SignatureRequest = require('./components/signature-request')
// const PendingMsg = require('./components/pending-msg')
// const PendingPersonalMsg = require('./components/pending-personal-msg')
// const PendingTypedMsg = require('./components/pending-typed-msg')
const Loading = require('./components/loading')

// const contentDivider = h('div', {
//   style: {
//     marginLeft: '16px',
//     marginRight: '16px',
//     height:'1px',
//     background:'#E7E7E7',
//   },
// })

module.exports = connect(mapStateToProps)(ConfirmTxScreen)

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

inherits(ConfirmTxScreen, Component)
function ConfirmTxScreen () {
  Component.call(this)
}

ConfirmTxScreen.prototype.render = function () {
  const props = this.props
  const {
    network,
    unapprovedTxs,
    currentCurrency,
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
    conversionRate,
    blockGasLimit,
    // provider,
    // computedBalances,
  } = props

  var unconfTxList = txHelper(unapprovedTxs, unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, network)

  var txData = unconfTxList[props.index] || {}
  var txParams = txData.params || {}

  // var isNotification = isPopupOrNotification() === 'notification'
  /*
    Client is using the flag above to render the following in conf screen
    // subtitle and nav
    h('.section-title.flex-row.flex-center', [
      !isNotification ? h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
        onClick: this.goHome.bind(this),
      }) : null,
      h('h2.page-subtitle', 'Confirm Transaction'),
      isNotification ? h(NetworkIndicator, {
        network: network,
        provider: provider,
      }) : null,
    ]),
  */

  log.info(`rendering a combined ${unconfTxList.length} unconf msg & txs`)
  if (unconfTxList.length === 0) return h(Loading)

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
    signTypedMessage: this.signTypedMessage.bind(this, txData),
    cancelMessage: this.cancelMessage.bind(this, txData),
    cancelPersonalMessage: this.cancelPersonalMessage.bind(this, txData),
    cancelTypedMessage: this.cancelTypedMessage.bind(this, txData),
  })

}

function currentTxView (opts) {
  log.info('rendering current tx view')
  const { txData } = opts
  const { txParams, msgParams } = txData

  if (txParams) {
    log.debug('txParams detected, rendering pending tx')
    return h(PendingTx, opts)
  } else if (msgParams) {
    log.debug('msgParams detected, rendering pending msg')

    return h(SignatureRequest, opts)

    // if (type === 'eth_sign') {
    //   log.debug('rendering eth_sign message')
    //   return h(PendingMsg, opts)
    // } else if (type === 'personal_sign') {
    //   log.debug('rendering personal_sign message')
    // return h(PendingPersonalMsg, opts)
    // } else if (type === 'eth_signTypedData') {
    //   log.debug('rendering eth_signTypedData message')
    //   return h(PendingTypedMsg, opts)
    // }
  }
  return h(Loading)
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

ConfirmTxScreen.prototype.cancelAllTransactions = function (unconfTxList, event) {
  this.stopPropagation(event)
  event.preventDefault()
  this.props.dispatch(actions.cancelAllTx(unconfTxList))
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

ConfirmTxScreen.prototype.signTypedMessage = function (msgData, event) {
  log.info('conf-tx.js: signing typed message')
  var params = msgData.msgParams
  params.metamaskId = msgData.id
  this.stopPropagation(event)
  this.props.dispatch(actions.signTypedMsg(params))
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

ConfirmTxScreen.prototype.cancelTypedMessage = function (msgData, event) {
  log.info('canceling typed message')
  this.stopPropagation(event)
  this.props.dispatch(actions.cancelTypedMsg(msgData))
}

ConfirmTxScreen.prototype.goHome = function (event) {
  this.stopPropagation(event)
  this.props.dispatch(actions.goHome())
}

// function warningIfExists (warning) {
//   if (warning &&
//      // Do not display user rejections on this screen:
//      warning.indexOf('User denied transaction signature') === -1) {
//     return h('.error', {
//       style: {
//         margin: 'auto',
//       },
//     }, warning)
//   }
// }
