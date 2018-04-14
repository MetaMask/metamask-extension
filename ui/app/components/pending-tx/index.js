const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const clone = require('clone')
const abi = require('human-standard-token-abi')
const abiDecoder = require('abi-decoder')
abiDecoder.addABI(abi)
const inherits = require('util').inherits
const actions = require('../../actions')
const util = require('../../util')
const ConfirmSendEther = require('./confirm-send-ether')
const ConfirmSendToken = require('./confirm-send-token')
const ConfirmDeployContract = require('./confirm-deploy-contract')
const Loading = require('../loading')

const TX_TYPES = {
  DEPLOY_CONTRACT: 'deploy_contract',
  SEND_ETHER: 'send_ether',
  SEND_TOKEN: 'send_token',
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(PendingTx)

function mapStateToProps (state) {
  const {
    conversionRate,
    identities,
  } = state.metamask
  const accounts = state.metamask.accounts
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]
  return {
    conversionRate,
    identities,
    selectedAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    backToAccountDetail: address => dispatch(actions.backToAccountDetail(address)),
    cancelTransaction: ({ id }) => dispatch(actions.cancelTx({ id })),
  }
}

inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
  this.state = {
    isFetching: true,
    transactionType: '',
    tokenAddress: '',
    tokenSymbol: '',
    tokenDecimals: '',
  }
}

PendingTx.prototype.componentDidMount = function () {
  this.setTokenData()
}

PendingTx.prototype.componentDidUpdate = function (prevProps, prevState) {
  if (prevState.isFetching) {
    this.setTokenData()
  }
}

PendingTx.prototype.setTokenData = async function () {
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  if (txMeta.loadingDefaults) {
    return
  }

  if (!txParams.to) {
    return this.setState({
      transactionType: TX_TYPES.DEPLOY_CONTRACT,
      isFetching: false,
    })
  }

  // inspect tx data for supported special confirmation screens
  let isTokenTransaction = false
  if (txParams.data) {
    const tokenData = abiDecoder.decodeMethod(txParams.data)
    const { name: tokenMethodName } = tokenData || {}
    isTokenTransaction = (tokenMethodName === 'transfer')
  }

  if (isTokenTransaction) {
    const token = util.getContractAtAddress(txParams.to)
    const results = await Promise.all([
      token.symbol(),
      token.decimals(),
    ])
    const [ symbol, decimals ] = results

    if (symbol[0] && decimals[0]) {
      this.setState({
        transactionType: TX_TYPES.SEND_TOKEN,
        tokenAddress: txParams.to,
        tokenSymbol: symbol[0],
        tokenDecimals: decimals[0],
        isFetching: false,
      })
    } else {
      this.setState({
        transactionType: TX_TYPES.SEND_TOKEN,
        tokenAddress: txParams.to,
        tokenSymbol: null,
        tokenDecimals: null,
        isFetching: false,
      })
    }
  } else {
    this.setState({
      transactionType: TX_TYPES.SEND_ETHER,
      isFetching: false,
    })
  }
}

PendingTx.prototype.gatherTxMeta = function () {
  const props = this.props
  const state = this.state
  const txData = clone(state.txData) || clone(props.txData)

  return txData
}

PendingTx.prototype.render = function () {
  const {
    isFetching,
    transactionType,
    tokenAddress,
    tokenSymbol,
    tokenDecimals,
  } = this.state

  const { sendTransaction } = this.props

  if (isFetching) {
    return h(Loading, {
      loadingMessage: this.context.t('estimatingTransaction'),
    })
  }

  switch (transactionType) {
    case TX_TYPES.SEND_ETHER:
      return h(ConfirmSendEther, {
        txData: this.gatherTxMeta(),
        sendTransaction,
      })
    case TX_TYPES.SEND_TOKEN:
      return h(ConfirmSendToken, {
        txData: this.gatherTxMeta(),
        sendTransaction,
        token: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
        },
      })
    case TX_TYPES.DEPLOY_CONTRACT:
      return h(ConfirmDeployContract, {
        txData: this.gatherTxMeta(),
        sendTransaction,
      })
    default:
      return h(Loading)
  }
}

PendingTx.contextTypes = {
  t: PropTypes.func,
}
