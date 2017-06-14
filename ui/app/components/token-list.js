const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TokenTracker = require('eth-token-tracker')
const TokenCell = require('./token-cell.js')
const contracts = require('eth-contract-metadata')
const Loading = require('./loading')

const tokens = []
for (let address in contracts) {
  const contract = contracts[address]
  if (contract.erc20) {
    contract.address = address
    tokens.push(contract)
  }
}

module.exports = TokenList

inherits(TokenList, Component)
function TokenList () {
  this.state = { tokens, isLoading: true }
  Component.call(this)
}

TokenList.prototype.render = function () {
  const state = this.state
  const { tokens, isLoading } = state

  const { userAddress } = this.props

  if (isLoading) return h(Loading, { isLoading })

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

    `)].concat(tokenViews))
  )
}

TokenList.prototype.componentDidMount = function () {
  if (!global.ethereumProvider) return
  const { userAddress } = this.props

  this.tracker = new TokenTracker({
    userAddress,
    provider: global.ethereumProvider,
    tokens: this.state.tokens,
    pollingInterval: 8000,
  })

  this.setState({ tokens: this.tracker.serialize() })
  this.tracker.on('update', (tokenData) => {
    const heldTokens = tokenData.filter(token => token.balance !== '0' && token.string !== '0.000')
    this.setState({ tokens: heldTokens, isLoading: false })
  })
  this.tracker.updateBalances()
}

TokenList.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
}

