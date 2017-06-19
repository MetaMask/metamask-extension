const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TokenTracker = require('eth-token-tracker')
const TokenCell = require('./token-cell.js')
const contracts = require('eth-contract-metadata')

const tokens = []
for (const address in contracts) {
  const contract = contracts[address]
  if (contract.erc20) {
    contract.address = address
    tokens.push(contract)
  }
}

module.exports = TokenList

inherits(TokenList, Component)
function TokenList () {
  this.state = { tokens, isLoading: true, network: null }
  Component.call(this)
}

TokenList.prototype.render = function () {
  const state = this.state
  const { tokens, isLoading } = state

  const { userAddress } = this.props

  if (isLoading) {
    return this.message('Loading')
  }

  const network = this.props.network

  const tokenViews = tokens.map((tokenData) => {
    tokenData.network = network
    tokenData.userAddress = userAddress
    return h(TokenCell, tokenData)
  })

  return (
    h('ol', {
      style: {
        height: '302px',
        overflowY: 'auto',
      },
    }, [h('style', `

    li.token-cell {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 10px;
    }

    li.token-cell > h3 {
      margin-left: 12px;
    }

    li.token-cell:hover {
      background: white;
      cursor: pointer;
    }

    `)].concat(tokenViews.length ? tokenViews : this.message('No Tokens Found.')))
  )
}

TokenList.prototype.message = function (body) {
  return h('div', {
    style: {
      display: 'flex',
      height: '250px',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }, body)
}

TokenList.prototype.componentDidMount = function () {
  this.createFreshTokenTracker()
}

TokenList.prototype.createFreshTokenTracker = function () {
  if (this.tracker) {
    this.tracker.stop()
  }

  if (!global.ethereumProvider) return
  const { userAddress } = this.props
  this.tracker = new TokenTracker({
    userAddress,
    provider: global.ethereumProvider,
    tokens: tokens,
    pollingInterval: 8000,
  })

  this.tracker.on('update', (tokenData) => {
    this.updateBalances(tokenData)
  })
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

TokenList.prototype.updateBalances = function (tokenData) {
  const heldTokens = tokenData.filter(token => token.balance !== '0' && token.string !== '0.000')
  this.setState({ tokens: heldTokens, isLoading: false })
}

TokenList.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
}

