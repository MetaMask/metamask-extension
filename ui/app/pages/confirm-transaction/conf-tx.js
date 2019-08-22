const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const actions = require('../../store/actions')
const txHelper = require('../../../lib/tx-helper')
const log = require('loglevel')
const R = require('ramda')

const SignatureRequest = require('../../components/app/signature-request')
const Loading = require('../../components/ui/loading-screen')
const { DEFAULT_ROUTE } = require('../../helpers/constants/routes')

module.exports = compose(
  withRouter,
  connect(mapStateToProps)
)(ConfirmTxScreen)

function mapStateToProps (state) {
  const { metamask } = state
  const {
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
  } = metamask

  return {
    identities: state.metamask.identities,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: state.metamask.unapprovedPersonalMsgs,
    unapprovedTypedMessages: state.metamask.unapprovedTypedMessages,
    index: state.appState.currentView.context,
    warning: state.appState.warning,
    network: state.metamask.network,
    provider: state.metamask.provider,
    currentCurrency: state.metamask.currentCurrency,
    blockGasLimit: state.metamask.currentBlockGasLimit,
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
    send: state.metamask.send,
    selectedAddressTxList: state.metamask.selectedAddressTxList,
  }
}

inherits(ConfirmTxScreen, Component)
function ConfirmTxScreen () {
  Component.call(this)
}

ConfirmTxScreen.prototype.getUnapprovedMessagesTotal = function () {
  const {
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
  } = this.props

  return unapprovedTypedMessagesCount + unapprovedMsgCount + unapprovedPersonalMsgCount
}

ConfirmTxScreen.prototype.componentDidMount = function () {
  const {
    unapprovedTxs = {},
    network,
    send,
  } = this.props
  const unconfTxList = txHelper(unapprovedTxs, {}, {}, {}, network)

  if (unconfTxList.length === 0 && !send.to && this.getUnapprovedMessagesTotal() === 0) {
    this.props.history.push(DEFAULT_ROUTE)
  }
}

ConfirmTxScreen.prototype.componentDidUpdate = function (prevProps) {
  const {
    unapprovedTxs = {},
    network,
    selectedAddressTxList,
    send,
    history,
    match: { params: { id: transactionId } = {} },
  } = this.props

  let prevTx

  if (transactionId) {
    prevTx = R.find(({ id }) => id + '' === transactionId)(selectedAddressTxList)
  } else {
    const { index: prevIndex, unapprovedTxs: prevUnapprovedTxs } = prevProps
    const prevUnconfTxList = txHelper(prevUnapprovedTxs, {}, {}, {}, network)
    const prevTxData = prevUnconfTxList[prevIndex] || {}
    prevTx = selectedAddressTxList.find(({ id }) => id === prevTxData.id) || {}
  }

  const unconfTxList = txHelper(unapprovedTxs, {}, {}, {}, network)

  if (prevTx && prevTx.status === 'dropped') {
    this.props.dispatch(actions.showModal({
      name: 'TRANSACTION_CONFIRMED',
      onSubmit: () => history.push(DEFAULT_ROUTE),
    }))

    return
  }

  if (unconfTxList.length === 0 && !send.to && this.getUnapprovedMessagesTotal() === 0) {
    this.props.history.push(DEFAULT_ROUTE)
  }
}

ConfirmTxScreen.prototype.getTxData = function () {
  const {
    network,
    index,
    unapprovedTxs,
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
    match: { params: { id: transactionId } = {} },
  } = this.props

  const unconfTxList = txHelper(
    unapprovedTxs,
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
    network
  )

  log.info(`rendering a combined ${unconfTxList.length} unconf msgs & txs`)

  return transactionId
    ? R.find(({ id }) => id + '' === transactionId)(unconfTxList)
    : unconfTxList[index]
}

ConfirmTxScreen.prototype.render = function () {
  const props = this.props
  const {
    currentCurrency,
    blockGasLimit,
  } = props

  var txData = this.getTxData() || {}
  const { msgParams } = txData
  log.debug('msgParams detected, rendering pending msg')

  return msgParams
    ? h(SignatureRequest, {
      // Properties
      txData: txData,
      key: txData.id,
      identities: props.identities,
      currentCurrency,
      blockGasLimit,
      // Actions
      signMessage: this.signMessage.bind(this, txData),
      signPersonalMessage: this.signPersonalMessage.bind(this, txData),
      signTypedMessage: this.signTypedMessage.bind(this, txData),
      cancelMessage: this.cancelMessage.bind(this, txData),
      cancelPersonalMessage: this.cancelPersonalMessage.bind(this, txData),
      cancelTypedMessage: this.cancelTypedMessage.bind(this, txData),
    })
    : h(Loading)
}

ConfirmTxScreen.prototype.signMessage = function (msgData, event) {
  log.info('conf-tx.js: signing message')
  var params = msgData.msgParams
  params.metamaskId = msgData.id
  this.stopPropagation(event)
  return this.props.dispatch(actions.signMsg(params))
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
  return this.props.dispatch(actions.signPersonalMsg(params))
}

ConfirmTxScreen.prototype.signTypedMessage = function (msgData, event) {
  log.info('conf-tx.js: signing typed message')
  var params = msgData.msgParams
  params.metamaskId = msgData.id
  this.stopPropagation(event)
  return this.props.dispatch(actions.signTypedMsg(params))
}

ConfirmTxScreen.prototype.cancelMessage = function (msgData, event) {
  log.info('canceling message')
  this.stopPropagation(event)
  return this.props.dispatch(actions.cancelMsg(msgData))
}

ConfirmTxScreen.prototype.cancelPersonalMessage = function (msgData, event) {
  log.info('canceling personal message')
  this.stopPropagation(event)
  return this.props.dispatch(actions.cancelPersonalMsg(msgData))
}

ConfirmTxScreen.prototype.cancelTypedMessage = function (msgData, event) {
  log.info('canceling typed message')
  this.stopPropagation(event)
  return this.props.dispatch(actions.cancelTypedMsg(msgData))
}
