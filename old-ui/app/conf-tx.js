import PropTypes from 'prop-types'
import { Component } from 'react'
import { connect } from 'react-redux'
const h = require('react-hyperscript')
const actions = require('../../ui/app/actions')
const LoadingIndicator = require('./components/loading')
const txHelper = require('../lib/tx-helper')
import log from 'loglevel'
const { getCurrentKeyring, ifContractAcc } = require('./util')

const PendingTx = require('./components/pending-tx')
import PendingMsg from './components/pending-msg'
import PendingPersonalMsg from './components/pending-personal-msg'
import PendingTypedMsg from './components/pending-typed-msg'
const Loading = require('./components/loading')
const { DAI_CODE, POA_SOKOL_CODE, RSK_TESTNET_CODE, GOERLI_TESTNET_CODE } = require('../../app/scripts/controllers/network/enums')
const { getMetaMaskAccounts } = require('../../ui/app/selectors')
import BigNumber from 'bignumber.js'


class ConfirmTxScreen extends Component {
  static propTypes = {
    network: PropTypes.string,
    identities: PropTypes.objectOf(PropTypes.object),
    keyrings: PropTypes.array,
    actions: PropTypes.objectOf(PropTypes.func),
    isToken: PropTypes.bool,
    isContractExecutionByUser: PropTypes.bool,
    selectedAddress: PropTypes.string,
    warning: PropTypes.string,
    unapprovedTxs: PropTypes.object,
    unapprovedMsgs: PropTypes.object,
    unapprovedPersonalMsgs: PropTypes.object,
    unapprovedTypedMessages: PropTypes.object,
    pendingTxIndex: PropTypes.number,
    blockGasLimit: PropTypes.string,
    accounts: PropTypes.object,
    currentCurrency: PropTypes.string,
    computedBalances: PropTypes.object,
    conversionRate: PropTypes.number,
    tokenSymbol: PropTypes.string,
    tokensToSend: PropTypes.objectOf(BigNumber),
    tokensTransferTo: PropTypes.string,
  }

  render () {
    const props = this.props
    const { network, unapprovedTxs, currentCurrency, computedBalances,
      unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, blockGasLimit } = props
    let { conversionRate } = props

    const isTestnet = parseInt(network) === POA_SOKOL_CODE || parseInt(network) === RSK_TESTNET_CODE || parseInt(network) === GOERLI_TESTNET_CODE
    const isDai = parseInt(network) === DAI_CODE
    if (isTestnet) {
      conversionRate = 0
    } else if (isDai) {
      conversionRate = 1
    }

    const unconfTxList = txHelper(unapprovedTxs, unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, network)
    const ind = props.pendingTxIndex || 0
    const txData = unconfTxList[ind] || {}
    const txParams = txData.params || {}

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
          buyEth: this.buyEth.bind(this, txParams.from || props.selectedAddress, props.isContractExecutionByUser),
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

  buyEth (address, isContractExecutionByUser, event) {
    event.preventDefault()
    this.props.actions.buyEthView(address, isContractExecutionByUser)
  }

  sendTransaction (txData, event) {
    this.stopPropagation(event)
    this.props.actions.updateAndApproveTx(txData)
    this._checkIfContractExecutionAndUnlockContract(txData)
  }

  cancelTransaction (txData, event) {
    this.stopPropagation(event)
    event.preventDefault()
    this.props.actions.cancelTx(txData)
    this._checkIfContractExecutionAndUnlockContract(txData)
  }

  cancelAllTransactions (unconfTxList, event) {
    this.stopPropagation(event)
    event.preventDefault()
    this.props.actions.cancelTxs(unconfTxList)
    this._checkIfMultipleContractExecutionAndUnlockContract(unconfTxList)
  }

  signMessage (msgData, event) {
    log.info('conf-tx.js: signing message')
    const params = msgData.msgParams
    params.metamaskId = msgData.id
    this.stopPropagation(event)
    this.props.actions.signMsg(params)
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
    this.props.actions.signPersonalMsg(params)
  }

  signTypedMessage (msgData, event) {
    log.info('conf-tx.js: signing typed message')
    const params = msgData.msgParams
    params.metamaskId = msgData.id
    this.stopPropagation(event)
    this.props.actions.signTypedMsg(params)
  }

  cancelMessage (msgData, event) {
    log.info('canceling message')
    this.stopPropagation(event)
    this.props.actions.cancelMsg(msgData)
  }

  cancelPersonalMessage (msgData, event) {
    log.info('canceling personal message')
    this.stopPropagation(event)
    this.props.actions.cancelPersonalMsg(msgData)
  }

  cancelTypedMessage (msgData, event) {
    log.info('canceling typed message')
    this.stopPropagation(event)
    this.props.actions.cancelTypedMsg(msgData)
  }

  _checkIfMultipleContractExecutionAndUnlockContract (unconfTxList) {
    const areTxsToOneContractFromTheList = unconfTxList.slice(0).reduce((res, txData, ind, unconfTxList) => {
      if (txData.txParams.data && this.props.isContractExecutionByUser) {
        const to = txData && txData.txParams && txData.txParams.to
        const targetContractIsInTheList = Object.keys(this.props.accounts).some((acc) => acc === to)
        if (targetContractIsInTheList && Object.keys(res).length === 0) {
          res = { status: true, to }
        } else if (res.status && res.to !== to) {
          res = { status: false }
          unconfTxList.splice(1)
        }
      } else {
        res = { status: false }
        unconfTxList.splice(1)
      }
      return res
    }, {})

    if (areTxsToOneContractFromTheList.status) {
      this._unlockContract(areTxsToOneContractFromTheList.to)
    }
  }

  _checkIfContractExecutionAndUnlockContract (txData) {
    if (txData.txParams.data && this.props.isContractExecutionByUser) {
      const to = txData && txData.txParams && txData.txParams.to
      const targetContractIsInTheList = Object.keys(this.props.accounts).some((acc) => acc === to)
      if (targetContractIsInTheList) {
        this._unlockContract(to)
      }
    }
  }

  _unlockContract (to) {
    const currentKeyring = getCurrentKeyring(to, this.props.network, this.props.keyrings, this.props.identities)
    if (ifContractAcc(currentKeyring)) {
      this.props.actions.showAccountDetail(to)
    }
  }
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

function mapStateToProps (state) {
  const { metamask, appState } = state
  const { screenParams, pendingTxIndex } = appState.currentView
  return {
    identities: metamask.identities,
    accounts: getMetaMaskAccounts(state),
    keyrings: metamask.keyrings,
    selectedAddress: metamask.selectedAddress,
    unapprovedTxs: metamask.unapprovedTxs,
    unapprovedMsgs: metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: metamask.unapprovedPersonalMsgs,
    unapprovedTypedMessages: metamask.unapprovedTypedMessages,
    pendingTxIndex: pendingTxIndex || 0,
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
    isContractExecutionByUser: (screenParams && screenParams.isContractExecutionByUser),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    actions: {
      buyEthView: (address, isContractExecutionByUser) => dispatch(actions.buyEthView(address, isContractExecutionByUser)),
      updateAndApproveTx: (txData) => dispatch(actions.updateAndApproveTx(txData)),
      cancelTx: (txData) => dispatch(actions.cancelTx(txData)),
      cancelTxs: (unconfTxList) => dispatch(actions.cancelTxs(unconfTxList)),
      signMsg: (params) => dispatch(actions.signMsg(params)),
      signPersonalMsg: (params) => dispatch(actions.signPersonalMsg(params)),
      signTypedMsg: (params) => dispatch(actions.signTypedMsg(params)),
      cancelMsg: (msgData) => dispatch(actions.cancelMsg(msgData)),
      cancelPersonalMsg: (msgData) => dispatch(actions.cancelPersonalMsg(msgData)),
      cancelTypedMsg: (msgData) => dispatch(actions.cancelTypedMsg(msgData)),
      showAccountDetail: (to) => dispatch(actions.showAccountDetail(to)),
    },
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ConfirmTxScreen)
