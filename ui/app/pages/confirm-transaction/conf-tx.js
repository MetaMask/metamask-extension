import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import log from 'loglevel'
import * as actions from '../../store/actions'
import txHelper from '../../../lib/tx-helper'
import SignatureRequest from '../../components/app/signature-request'
import SignatureRequestOriginal from '../../components/app/signature-request-original'
import Loading from '../../components/ui/loading-screen'
import { getMostRecentOverviewPage } from '../../ducks/history/history'
import { MESSAGE_TYPE } from '../../../../app/scripts/lib/enums'

function mapStateToProps(state) {
  const { metamask, appState } = state
  const {
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
  } = metamask
  const { txId } = appState

  return {
    identities: state.metamask.identities,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: state.metamask.unapprovedPersonalMsgs,
    unapprovedTypedMessages: state.metamask.unapprovedTypedMessages,
    index: txId,
    warning: state.appState.warning,
    network: state.metamask.network,
    currentCurrency: state.metamask.currentCurrency,
    blockGasLimit: state.metamask.currentBlockGasLimit,
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
    send: state.metamask.send,
    currentNetworkTxList: state.metamask.currentNetworkTxList,
  }
}

class ConfirmTxScreen extends Component {
  static propTypes = {
    mostRecentOverviewPage: PropTypes.string.isRequired,
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
        id: PropTypes.string,
      }),
    }),

    currentNetworkTxList: PropTypes.array,
    currentCurrency: PropTypes.string,
    blockGasLimit: PropTypes.string,
    history: PropTypes.object,
    identities: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    send: PropTypes.shape({
      to: PropTypes.string,
    }).isRequired,
  }

  getUnapprovedMessagesTotal() {
    const {
      unapprovedMsgCount = 0,
      unapprovedPersonalMsgCount = 0,
      unapprovedTypedMessagesCount = 0,
    } = this.props

    return (
      unapprovedTypedMessagesCount +
      unapprovedMsgCount +
      unapprovedPersonalMsgCount
    )
  }

  getTxData() {
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
      network,
    )

    log.info(`rendering a combined ${unconfTxList.length} unconf msgs & txs`)

    return transactionId
      ? unconfTxList.find(({ id }) => `${id}` === transactionId)
      : unconfTxList[index]
  }

  signatureSelect(type, version) {
    // Temporarily direct only v3 and v4 requests to new code.
    if (
      type === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA &&
      (version === 'V3' || version === 'V4')
    ) {
      return SignatureRequest
    }

    return SignatureRequestOriginal
  }

  signMessage(msgData, event) {
    log.info('conf-tx.js: signing message')
    const params = msgData.msgParams
    params.metamaskId = msgData.id
    this.stopPropagation(event)
    return this.props.dispatch(actions.signMsg(params))
  }

  stopPropagation(event) {
    if (event.stopPropagation) {
      event.stopPropagation()
    }
  }

  signPersonalMessage(msgData, event) {
    log.info('conf-tx.js: signing personal message')
    const params = msgData.msgParams
    params.metamaskId = msgData.id
    this.stopPropagation(event)
    return this.props.dispatch(actions.signPersonalMsg(params))
  }

  signTypedMessage(msgData, event) {
    log.info('conf-tx.js: signing typed message')
    const params = msgData.msgParams
    params.metamaskId = msgData.id
    this.stopPropagation(event)
    return this.props.dispatch(actions.signTypedMsg(params))
  }

  cancelMessage(msgData, event) {
    log.info('canceling message')
    this.stopPropagation(event)
    return this.props.dispatch(actions.cancelMsg(msgData))
  }

  cancelPersonalMessage(msgData, event) {
    log.info('canceling personal message')
    this.stopPropagation(event)
    return this.props.dispatch(actions.cancelPersonalMsg(msgData))
  }

  cancelTypedMessage(msgData, event) {
    log.info('canceling typed message')
    this.stopPropagation(event)
    return this.props.dispatch(actions.cancelTypedMsg(msgData))
  }

  componentDidMount() {
    const {
      unapprovedTxs = {},
      history,
      mostRecentOverviewPage,
      network,
      send,
    } = this.props
    const unconfTxList = txHelper(unapprovedTxs, {}, {}, {}, network)

    if (
      unconfTxList.length === 0 &&
      !send.to &&
      this.getUnapprovedMessagesTotal() === 0
    ) {
      history.push(mostRecentOverviewPage)
    }
  }

  componentDidUpdate(prevProps) {
    const {
      unapprovedTxs = {},
      network,
      currentNetworkTxList,
      send,
      history,
      match: { params: { id: transactionId } = {} },
      mostRecentOverviewPage,
    } = this.props

    let prevTx

    if (transactionId) {
      prevTx = currentNetworkTxList.find(({ id }) => `${id}` === transactionId)
    } else {
      const { index: prevIndex, unapprovedTxs: prevUnapprovedTxs } = prevProps
      const prevUnconfTxList = txHelper(prevUnapprovedTxs, {}, {}, {}, network)
      const prevTxData = prevUnconfTxList[prevIndex] || {}
      prevTx = currentNetworkTxList.find(({ id }) => id === prevTxData.id) || {}
    }

    const unconfTxList = txHelper(unapprovedTxs, {}, {}, {}, network)

    if (prevTx && prevTx.status === 'dropped') {
      this.props.dispatch(
        actions.showModal({
          name: 'TRANSACTION_CONFIRMED',
          onSubmit: () => history.push(mostRecentOverviewPage),
        }),
      )

      return
    }

    if (
      unconfTxList.length === 0 &&
      !send.to &&
      this.getUnapprovedMessagesTotal() === 0
    ) {
      this.props.history.push(mostRecentOverviewPage)
    }
  }

  render() {
    const { currentCurrency, blockGasLimit } = this.props

    const txData = this.getTxData() || {}
    const {
      msgParams,
      type,
      msgParams: { version },
    } = txData
    log.debug('msgParams detected, rendering pending msg')

    if (!msgParams) {
      return <Loading />
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

export default compose(withRouter, connect(mapStateToProps))(ConfirmTxScreen)
