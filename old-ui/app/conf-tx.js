const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../ui/app/actions')
const LoadingIndicator = require('./components/loading')
const txHelper = require('../lib/tx-helper')
const log = require('loglevel')

const PendingTx = require('./components/pending-tx')
const PendingMsg = require('./components/pending-msg')
const PendingPersonalMsg = require('./components/pending-personal-msg')
const PendingTypedMsg = require('./components/pending-typed-msg')
const Loading = require('./components/loading')

module.exports = connect(mapStateToProps)(ConfirmTxScreen)

function mapStateToProps (state) {
  const { metamask, appState } = state
  const { screenParams, pendingTxIndex } = appState.currentView
  return {
    identities: metamask.identities,
    accounts: metamask.accounts,
    selectedAddress: metamask.selectedAddress,
    unapprovedTxs: metamask.unapprovedTxs,
    unapprovedMsgs: metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: metamask.unapprovedPersonalMsgs,
    unapprovedTypedMessages: metamask.unapprovedTypedMessages,
    index: pendingTxIndex || 0,
    warning: appState.warning,
    network: metamask.network,
    provider: metamask.provider,
    conversionRate: metamask.conversionRate,
    currentCurrency: metamask.currentCurrency,
    blockGasLimit: metamask.currentBlockGasLimit,
    computedBalances: metamask.computedBalances,
    isToken: (screenParams && screenParams.isToken),
    tokenSymbol: (screenParams && screenParams.tokenSymbol),
    tokensToSend: (screenParams && screenParams.tokensToSend),
    tokensTransferTo: (screenParams && screenParams.tokensTransferTo),
  }
}

inherits(ConfirmTxScreen, Component)
function ConfirmTxScreen () {
  Component.call(this)
}

ConfirmTxScreen.prototype.render = function () {
  const props = this.props
  const { network, unapprovedTxs, currentCurrency, computedBalances,
    unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, blockGasLimit } = props
  let { conversionRate } = props

  const isSokol = parseInt(network) === 77
  if (isSokol) {
    conversionRate = 0
  }

  var unconfTxList = txHelper(unapprovedTxs, unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, network)
  const ind = props.index || 0
  var txData = unconfTxList[ind] || {}
  var txParams = txData.params || {}

  log.info(`rendering a combined ${unconfTxList.length} unconf msg & txs`)
  if (unconfTxList.length === 0) return h(Loading, { isLoading: true })

  const unconfTxListLength = unconfTxList.length

  return (

    h('.flex-column.flex-grow', {
      style: {
        width: '100%',
      },
    }, [

      h(LoadingIndicator, {
        isLoading: this.state ? !this.state.bypassLoadingScreen : txData.loadingDefaults,
        loadingMessage: 'Estimating transaction cost…',
        canBypass: true,
        bypass: () => {
          this.setState({bypassLoadingScreen: true})
        },
      }),

      // subtitle and nav

      warningIfExists(props.warning),

      currentTxView({
        // Properties
        txData: txData,
        key: txData.id,
        selectedAddress: props.selectedAddress,
        accounts: props.accounts,
        identities: props.identities,
        conversionRate,
        currentCurrency,
        blockGasLimit,
        unconfTxListLength,
        computedBalances,
        network,
        isToken: props.isToken,
        tokenSymbol: props.tokenSymbol,
        tokensToSend: props.tokensToSend,
        tokensTransferTo: props.tokensTransferTo,
        // Actions
        buyEth: this.buyEth.bind(this, txParams.from || props.selectedAddress),
        sendTransaction: this.sendTransaction.bind(this),
        cancelTransaction: this.cancelTransaction.bind(this, txData),
        cancelAllTransactions: this.cancelAllTransactions.bind(this, unconfTxList),
        signMessage: this.signMessage.bind(this, txData),
        signPersonalMessage: this.signPersonalMessage.bind(this, txData),
        signTypedMessage: this.signTypedMessage.bind(this, txData),
        cancelMessage: this.cancelMessage.bind(this, txData),
        cancelPersonalMessage: this.cancelPersonalMessage.bind(this, txData),
        cancelTypedMessage: this.cancelTypedMessage.bind(this, txData),
      }),
    ])
  )
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
    } else if (type === 'eth_signTypedData') {
      log.debug('rendering eth_signTypedData message')
      return h(PendingTypedMsg, opts)
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
