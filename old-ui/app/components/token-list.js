const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TokenTracker = require('eth-token-watcher')
const TokenCell = require('./token-cell.js')
const log = require('loglevel')

module.exports = TokenList

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
    return h('.hotFix', {
      style: {
        padding: '30px',
      },
    }, [
      'We had trouble loading your token balances. You can view them ',
      h('span.hotFix', {
        style: {
          color: '#60db97',
          cursor: 'pointer',
        },
        onClick: () => {
          global.platform.openWindow({
          url: `https://ethplorer.io/address/${userAddress}`,
        })
        },
      }, 'here'),
    ])
  }

  const tokensFromCurrentNetwork = tokens.filter(token => (parseInt(token.network) === parseInt(network) || !token.network))

  const tokenViews = tokensFromCurrentNetwork.map((tokenData, ind) => {
    tokenData.userAddress = userAddress
    const isLastTokenCell = ind === (tokensFromCurrentNetwork.length - 1)
    const menuToTop = true
    return h(TokenCell, {
      ind,
      ...tokenData,
      isLastTokenCell,
      menuToTop,
      removeToken: this.props.removeToken,
    })
  })

  return h('.full-flex-height', [
    this.renderTokenStatusBar(),

    h('ol.full-flex-height.flex-column', {
      style: {
        display: 'flex',
        flexDirection: 'column',
      },
    }, [
      h('style', `

        li.token-cell {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 10px;
          min-height: 50px;
        }

        li.token-cell > h3 {
          margin-left: 12px;
        }

        li.token-cell:hover {
          background: white;
          cursor: pointer;
        }

      `),
      ...tokenViews,
      h('.flex-grow'),
    ]),
  ])
}

TokenList.prototype.renderTokenStatusBar = function () {
  const { tokens } = this.state
  const { network } = this.props
  const tokensFromCurrentNetwork = tokens.filter(token => (parseInt(token.network) === parseInt(network) || !token.network))

  let msg
  if (tokensFromCurrentNetwork.length === 1) {
    msg = `You own 1 token`
  } else if (tokensFromCurrentNetwork.length > 1) {
    msg = `You own ${tokensFromCurrentNetwork.length} tokens`
  } else {
    msg = `No tokens found`
  }

  return h('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: '70px',
      padding: '30px 30px 10px',
    },
  }, [
    h('span', msg),
    h('button', {
      key: 'reveal-account-bar',
      onClick: (event) => {
        event.preventDefault()
        this.props.addToken()
      },
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    }, [
      'Add Token',
    ]),
  ])
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

TokenList.prototype.createFreshTokenTracker = function (userAddress) {
  if (this.tracker) {
    // Clean up old trackers when refreshing:
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }

  if (!global.ethereumProvider) return
  this.tracker = new TokenTracker({
    userAddress: userAddress || this.props.userAddress,
    provider: global.ethereumProvider,
    tokens: this.props.tokens,
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

  const oldAddress = this.props.userAddress
  const newAddress = nextProps.userAddress

  if (oldNet && newNet && (newNet !== oldNet || newAddress !== oldAddress)) {
    this.setState({ isLoading: true })
    this.createFreshTokenTracker(newAddress)
  }
}

TokenList.prototype.updateBalances = function (tokens) {
  this.setState({ tokens, error: null, isLoading: false })
}

TokenList.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
}

