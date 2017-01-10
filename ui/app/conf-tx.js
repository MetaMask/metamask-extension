const inherits = require('util').inherits
const Component = require('react').Component
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')
const NetworkIndicator = require('./components/network')
const txHelper = require('../lib/tx-helper')
const isPopupOrNotification = require('../../app/scripts/lib/is-popup-or-notification')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

const PendingTx = require('./components/pending-tx')
const PendingMsg = require('./components/pending-msg')

module.exports = connect(mapStateToProps)(ConfirmTxScreen)

function mapStateToProps (state) {
  return {
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
    selectedAccount: state.metamask.selectedAccount,
    unconfTxs: state.metamask.unconfTxs,
    unconfMsgs: state.metamask.unconfMsgs,
    index: state.appState.currentView.context,
    warning: state.appState.warning,
    network: state.metamask.network,
    provider: state.metamask.provider,
  }
}

inherits(ConfirmTxScreen, Component)
function ConfirmTxScreen () {
  Component.call(this)
}

ConfirmTxScreen.prototype.render = function () {
  var state = this.props

  var network = state.network
  var provider = state.provider
  var unconfTxs = state.unconfTxs
  var unconfMsgs = state.unconfMsgs
  var unconfTxList = txHelper(unconfTxs, unconfMsgs, network)
  var index = state.index !== undefined ? state.index : 0
  var txData = unconfTxList[index] || unconfTxList[0] || {}
  var txParams = txData.txParams || {}
  var isNotification = isPopupOrNotification() === 'notification'
  return (

    h('.flex-column.flex-grow', [

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
        className: 'css-transition-group',
        transitionName: 'main',
        transitionEnterTimeout: 300,
        transitionLeaveTimeout: 300,
      }, [

        currentTxView({
          // Properties
          txData: txData,
          key: txData.id,
          selectedAccount: state.selectedAccount,
          accounts: state.accounts,
          identities: state.identities,
          insufficientBalance: this.checkBalanceAgainstTx(txData),
          // Actions
          buyEth: this.buyEth.bind(this, txParams.from || state.selectedAccount),
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
    return h(PendingTx, opts)
  } else if ('msgParams' in opts.txData) {
    // This is a pending message to sign
    return h(PendingMsg, opts)
  }
}
ConfirmTxScreen.prototype.checkBalanceAgainstTx = function (txData) {
  var state = this.props
  var address = txData.txParams.from || state.selectedAccount
  var account = state.accounts[address]
  var balance = account ? account.balance : '0x0'
  var maxCost = new BN(txData.maxCost)

  var balanceBn = new BN(ethUtil.stripHexPrefix(balance), 16)
  return maxCost.gt(balanceBn)
}

ConfirmTxScreen.prototype.buyEth = function (address, event) {
  event.stopPropagation()
  this.props.dispatch(actions.buyEthView(address))
}

ConfirmTxScreen.prototype.sendTransaction = function (txData, event) {
  event.stopPropagation()
  this.props.dispatch(actions.sendTx(txData))
}

ConfirmTxScreen.prototype.cancelTransaction = function (txData, event) {
  event.stopPropagation()
  this.props.dispatch(actions.cancelTx(txData))
}

ConfirmTxScreen.prototype.signMessage = function (msgData, event) {
  var params = msgData.msgParams
  params.metamaskId = msgData.id
  event.stopPropagation()
  this.props.dispatch(actions.signMsg(params))
}

ConfirmTxScreen.prototype.cancelMessage = function (msgData, event) {
  event.stopPropagation()
  this.props.dispatch(actions.cancelMsg(msgData))
}

ConfirmTxScreen.prototype.goHome = function (event) {
  event.stopPropagation()
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
