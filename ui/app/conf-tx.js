const inherits = require('util').inherits
const Component = require('react').Component
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const copyToClipboard = require('copy-to-clipboard')
const actions = require('./actions')
const AccountPanel = require('./components/account-panel')
const valuesFor = require('./util').valuesFor
const txHelper = require('../lib/tx-helper')

const ConfirmTx = require('./components/pending-tx')
const PendingMsg = require('./components/pending-msg')

module.exports = connect(mapStateToProps)(ConfirmTxScreen)

function mapStateToProps(state) {
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    selectedAddress: state.metamask.selectedAddress,
    unconfTxs: state.metamask.unconfTxs,
    unconfMsgs: state.metamask.unconfMsgs,
    index: state.appState.currentView.context,
    warning: state.appState.warning,
  }
}

inherits(ConfirmTxScreen, Component)
function ConfirmTxScreen() {
  Component.call(this)
}


ConfirmTxScreen.prototype.render = function() {
  var state = this.props

  var unconfTxs = state.unconfTxs
  var unconfMsgs = state.unconfMsgs
  var unconfTxList = txHelper(unconfTxs, unconfMsgs)
  var index = state.index !== undefined ? state.index : 0
  var txData = unconfTxList[index] || {}

  return (

    h('.unconftx-section.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.goHome.bind(this),
        }),
        h('h2.page-subtitle', 'Confirmation'),
      ]),

      h('h3', {
        style: {
          alignSelf: 'center',
          display: unconfTxList.length > 1 ? 'block' : 'none',
        },
      }, [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          style: {
            display: state.index === 0 ? 'none' : 'inline-block',
          },
          onClick: () => state.dispatch(actions.previousTx()),
        }),
        ` ${state.index + 1} of ${unconfTxList.length} `,
        h('i.fa.fa-arrow-right.fa-lg.cursor-pointer', {
          style: {
            display: state.index + 1 === unconfTxList.length ? 'none' : 'inline-block',
          },
          onClick: () => state.dispatch(actions.nextTx()),
        }),
      ]),

      warningIfExists(state.warning),

      h(ReactCSSTransitionGroup, {
        transitionName: "main",
        transitionEnterTimeout: 300,
        transitionLeaveTimeout: 300,
      }, [

        currentTxView({
          // Properties
          txData: txData,
          key: txData.id,
          selectedAddress: state.selectedAddress,
          accounts: state.accounts,
          identities: state.identities,
          // Actions
          sendTransaction: this.sendTransaction.bind(this, txData),
          cancelTransaction: this.cancelTransaction.bind(this, txData),
          signMessage: this.signMessage.bind(this, txData),
          cancelMessage: this.cancelMessage.bind(this, txData),
        }),

      ]),
    ])
  )
}

function currentTxView (opts) {

  if ('txParams' in opts.txData) {
    // This is a pending transaction
    return h(ConfirmTx, opts)
  } else if ('msgParams' in opts.txData) {
    // This is a pending message to sign
    return h(PendingMsg, opts)
  }
}

ConfirmTxScreen.prototype.sendTransaction = function(txData, event){
  event.stopPropagation()
  this.props.dispatch(actions.sendTx(txData))
}

ConfirmTxScreen.prototype.cancelTransaction = function(txData, event){
  event.stopPropagation()
  this.props.dispatch(actions.cancelTx(txData))
}

ConfirmTxScreen.prototype.signMessage = function(msgData, event){
  var params = msgData.msgParams
  params.metamaskId = msgData.id
  event.stopPropagation()
  this.props.dispatch(actions.signMsg(params))
}

ConfirmTxScreen.prototype.cancelMessage = function(msgData, event){
  event.stopPropagation()
  this.props.dispatch(actions.cancelMsg(msgData))
}

ConfirmTxScreen.prototype.goHome = function(event){
  event.stopPropagation()
  this.props.dispatch(actions.goHome())
}

function warningIfExists(warning) {
  if (warning) {
    return h('span.error', { style: { margin: 'auto' } }, warning)
  }
}
