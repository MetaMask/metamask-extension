<<<<<<< HEAD
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

const SignatureRequest = require('../../components/app/signature-request').default
const SignatureRequestOriginal = require('../../components/app/signature-request-original')
const Loading = require('../../components/ui/loading-screen')
const { DEFAULT_ROUTE } = require('../../helpers/constants/routes')

module.exports = compose(
  withRouter,
  connect(mapStateToProps)
)(ConfirmTxScreen)
=======
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import * as actions from '../../store/actions'
import txHelper from '../../../lib/tx-helper'
import log from 'loglevel'
import R from 'ramda'
import SignatureRequest from '../../components/app/signature-request'
import SignatureRequestOriginal from '../../components/app/signature-request-original'
import Loading from '../../components/ui/loading-screen'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

function mapStateToProps (state) {
  const { metamask, appState } = state
  const {
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
  } = metamask
  const {
    txId,
  } = appState

  return {
    identities: state.metamask.identities,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: state.metamask.unapprovedPersonalMsgs,
    unapprovedTypedMessages: state.metamask.unapprovedTypedMessages,
    index: txId,
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

class ConfirmTxScreen extends Component {
  static propTypes = {
    unapprovedMsgCount: PropTypes.number,
    unapprovedPersonalMsgCount: PropTypes.number,
    unapprovedTypedMessagesCount: PropTypes.number,
    network: PropTypes.string,
    index: PropTypes.number,
    unapprovedTxs: PropTypes.object,
    unapprovedMsgs: PropTypes.object,
    unapprovedPersonalMsgs: PropTypes.object,
    unapprovedTypedMessages: PropTypes.object,
    match: PropTypes.shape({
      params: PropTypes.shape({
        id: PropTypes.number,
      }),
    }),

    selectedAddressTxList: PropTypes.array,
    currentCurrency: PropTypes.string,
    blockGasLimit: PropTypes.string,
    history: PropTypes.object,
    identities: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    send: PropTypes.shape({
      to: PropTypes.string,
    }).isRequired,
  }

  getUnapprovedMessagesTotal () {
    const {
      unapprovedMsgCount = 0,
      unapprovedPersonalMsgCount = 0,
      unapprovedTypedMessagesCount = 0,
    } = this.props

    return unapprovedTypedMessagesCount + unapprovedMsgCount + unapprovedPersonalMsgCount
  }

  getTxData () {
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

  signatureSelect (type, version) {
    // Temporarily direct only v3 and v4 requests to new code.
    if (type === 'eth_signTypedData' && (version === 'V3' || version === 'V4')) {
      return SignatureRequest
    }

    return SignatureRequestOriginal
  }

  signMessage (msgData, event) {
    log.info('conf-tx.js: signing message')
    const params = msgData.msgParams
    params.metamaskId = msgData.id
    this.stopPropagation(event)
    return this.props.dispatch(actions.signMsg(params))
  }

  stopPropagation (event) {
    if (event.stopPropagation) {
      event.stopPropagation()
    }
  }

  signPersonalMessage (msgData, event) {
    log.info('conf-tx.js: signing personal message')
    const params = msgData.msgParams
    params.metamaskId = msgData.id
    this.stopPropagation(event)
    return this.props.dispatch(actions.signPersonalMsg(params))
  }

<<<<<<< HEAD
ConfirmTxScreen.prototype.render = function () {
  const props = this.props
  const {
    currentCurrency,
    blockGasLimit,
    conversionRate,
  } = props

  var txData = this.getTxData() || {}
  const { msgParams, type, msgParams: { version } } = txData
  log.debug('msgParams detected, rendering pending msg')

  return msgParams ? h(this.signatureSelect(type, version), {
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
    signMessage: this.signMessage.bind(this, txData),
    signPersonalMessage: this.signPersonalMessage.bind(this, txData),
    signTypedMessage: this.signTypedMessage.bind(this, txData),
    cancelMessage: this.cancelMessage.bind(this, txData),
    cancelPersonalMessage: this.cancelPersonalMessage.bind(this, txData),
    cancelTypedMessage: this.cancelTypedMessage.bind(this, txData),
  }) : h(Loading)
}

ConfirmTxScreen.prototype.signMessage = function (msgData, event) {
  log.info('conf-tx.js: signing message')
  var params = msgData.msgParams
  params.metamaskId = msgData.id
  this.stopPropagation(event)
  return this.props.dispatch(actions.signMsg(params))
}
=======
  signTypedMessage (msgData, event) {
    log.info('conf-tx.js: signing typed message')
    const params = msgData.msgParams
    params.metamaskId = msgData.id
    this.stopPropagation(event)
    return this.props.dispatch(actions.signTypedMsg(params))
  }

  cancelMessage (msgData, event) {
    log.info('canceling message')
    this.stopPropagation(event)
    return this.props.dispatch(actions.cancelMsg(msgData))
  }

  cancelPersonalMessage (msgData, event) {
    log.info('canceling personal message')
    this.stopPropagation(event)
    return this.props.dispatch(actions.cancelPersonalMsg(msgData))
  }

  cancelTypedMessage (msgData, event) {
    log.info('canceling typed message')
    this.stopPropagation(event)
    return this.props.dispatch(actions.cancelTypedMsg(msgData))
  }

  componentDidMount () {
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
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

  componentDidUpdate (prevProps) {
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

<<<<<<< HEAD
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
=======
  render () {
    const {
      currentCurrency,
      blockGasLimit,
    } = this.props

    const txData = this.getTxData() || {}
    const { msgParams, type, msgParams: { version } } = txData
    log.debug('msgParams detected, rendering pending msg')
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

    if (!msgParams) {
      return (
        <Loading />
      )
    }

    const SigComponent = this.signatureSelect(type, version)
    return (
      <SigComponent
        txData={txData}
        key={txData.id}
        identities={this.props.identities}
        currentCurrency={currentCurrency}
        blockGasLimit={blockGasLimit}
        signMessage={this.signMessage.bind(this, txData)}
        signPersonalMessage={this.signPersonalMessage.bind(this, txData)}
        signTypedMessage={this.signTypedMessage.bind(this, txData)}
        cancelMessage={this.cancelMessage.bind(this, txData)}
        cancelPersonalMessage={this.cancelPersonalMessage.bind(this, txData)}
        cancelTypedMessage={this.cancelTypedMessage.bind(this, txData)}
      />
    )
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(ConfirmTxScreen)
