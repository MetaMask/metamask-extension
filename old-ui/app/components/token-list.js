const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TokenTracker = require('eth-token-tracker')
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
        padding: '80px',
      },
    }, [
      'We had trouble loading your token balances. You can view them ',
      h('span.hotFix', {
        style: {
          color: 'rgba(247, 134, 28, 1)',
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

  const tokenViews = tokens.map((tokenData) => {
    tokenData.network = network
    tokenData.userAddress = userAddress
    return h(TokenCell, tokenData)
  })

  return h('.full-flex-height', [
    this.renderTokenStatusBar(),

    h('ol.full-flex-height.flex-column', {
      style: {
        overflowY: 'auto',
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

  let msg
  if (tokens.length === 1) {
    msg = `You own 1 token`
  } else if (tokens.length > 1) {
    msg = `You own ${tokens.length} tokens`
  } else {
    msg = `No tokens found`
  }

  return h('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: '70px',
      padding: '10px',
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
        height: '40px',
        padding: '10px',
        justifyContent: 'center',
        alignItems: 'center',
      },
    }, [
      'ADD TOKEN',
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

  if (oldNet && newNet && newNet !== oldNet) {
    this.setState({ isLoading: true })
    this.createFreshTokenTracker()
  }
}

TokenList.prototype.updateBalances = function (tokens) {
  this.setState({ tokens, isLoading: false })
}

TokenList.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
}

