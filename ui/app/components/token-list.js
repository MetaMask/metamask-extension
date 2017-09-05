const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TokenTracker = require('eth-token-tracker')
const TokenCell = require('./token-cell.js')
const normalizeAddress = require('eth-sig-util').normalize
const connect = require('react-redux').connect
const selectors = require('../selectors')

function mapStateToProps (state) {

  return {
    network: state.metamask.network,
    tokens: state.metamask.tokens,
    userAddress: selectors.getSelectedAddress(state),
  }
}

const defaultTokens = []
const contracts = require('eth-contract-metadata')
for (const address in contracts) {
  const contract = contracts[address]
  if (contract.erc20) {
    contract.address = address
    defaultTokens.push(contract)
  }
}

module.exports = connect(mapStateToProps)(TokenList)


inherits(TokenList, Component)
function TokenList () {
  this.state = {
    tokens: [],
    isLoading: true,
    network: null,
  }
  Component.call(this)
}

TokenList.prototype.render = function () {
  const state = this.state
  const { tokens, isLoading, error } = state
  const { userAddress, network } = this.props

  if (isLoading) {
    return this.message('Loading')
  }

  if (error) {
    log.error(error)
    return this.message('There was a problem loading your token balances.')
  }

  const tokenViews = tokens.map((tokenData) => {
    tokenData.network = network
    tokenData.userAddress = userAddress
    return h(TokenCell, tokenData)
  })

  return h('div', tokenViews)
}

TokenList.prototype.message = function (body) {
  return h('div', {
    style: {
      display: 'flex',
      height: '250px',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
    },
  }, body)
}

TokenList.prototype.componentDidMount = function () {
  this.createFreshTokenTracker()
}

TokenList.prototype.createFreshTokenTracker = function () {
  if (this.tracker) {
    // Clean up old trackers when refreshing:
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

  if (!global.ethereumProvider) return
  const { userAddress } = this.props

  this.tracker = new TokenTracker({
    userAddress,
    provider: global.ethereumProvider,
    tokens: uniqueMergeTokens(defaultTokens, this.props.tokens),
    pollingInterval: 8000,
  })


  // Set up listener instances for cleaning up
  this.balanceUpdater = this.updateBalances.bind(this)
  this.showError = (error) => {
    this.setState({ error, isLoading: false })
  }
  this.tracker.on('update', this.balanceUpdater)
  this.tracker.on('error', this.showError)

  this.tracker.updateBalances()
  .then(() => {
    this.updateBalances(this.tracker.serialize())
  })
  .catch((reason) => {
    log.error(`Problem updating balances`, reason)
    this.setState({ isLoading: false })
  })
}

TokenList.prototype.componentWillUpdate = function (nextProps) {
  if (nextProps.network === 'loading') return
  const oldNet = this.props.network
  const newNet = nextProps.network

  if (oldNet && newNet && newNet !== oldNet) {
    this.setState({ isLoading: true })
    this.createFreshTokenTracker()
  }
}

TokenList.prototype.updateBalances = function (tokens) {
  // const heldTokens = tokens.filter(token => {
  //   return token.balance !== '0' && token.string !== '0.000'
  // })
  this.setState({ tokens: tokens, isLoading: false })
}

TokenList.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
}

function uniqueMergeTokens (tokensA, tokensB = []) {
  const uniqueAddresses = []
  const result = []
  tokensA.concat(tokensB).forEach((token) => {
    const normal = normalizeAddress(token.address)
    if (!uniqueAddresses.includes(normal)) {
      uniqueAddresses.push(normal)
      result.push(token)
    }
  })
  return result
}

