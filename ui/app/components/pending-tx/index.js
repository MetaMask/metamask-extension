const Component = require('react').Component
const { connect } = require('react-redux')
const h = require('react-hyperscript')
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
    setCurrentCurrencyToUSD: () => dispatch(actions.setCurrentCurrency('usd')),
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

PendingTx.prototype.componentWillMount = async function () {
  const txMeta = this.gatherTxMeta()
  const txParams = txMeta.txParams || {}

  this.props.setCurrentCurrencyToUSD()

  if (!txParams.to) {
    return this.setState({
      transactionType: TX_TYPES.DEPLOY_CONTRACT,
      isFetching: false,
    })
  }

  try {
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
        transactionType: TX_TYPES.SEND_ETHER,
        isFetching: false,
      })
    }
  } catch (e) {
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
    return h('noscript')
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
      return h('noscript')
  }
}
