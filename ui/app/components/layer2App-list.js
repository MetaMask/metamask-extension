const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TokenTracker = require('eth-token-tracker')
const Layer2AppCell = require('./layer2App-cell.js')
const connect = require('react-redux').connect
const selectors = require('../selectors')
const log = require('loglevel')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    layer2Apps: state.metamask.layer2Apps,
    userAddress: selectors.getSelectedAddress(state),
    assetImages: state.metamask.assetImages,
  }
}

//const defaultLayer2Apps = 
// const contracts = require('eth-contract-metadata')
// for (const address in contracts) {
//   const contract = contracts[address]
//   if (contract.erc20) {
//     contract.address = address
//     defaultTokens.push(contract)
//   }
// }

TokenList.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps)(TokenList)


inherits(TokenList, Component)
function TokenList () {
  this.state = {
    layer2Apps: [],
    isLoading: true,
    network: null,
  }
  Component.call(this)
}

TokenList.prototype.render = function () {
  const { userAddress, assetImages } = this.props
  const state = this.state
  //  const { s, isLoading, error } = state
  let { layer2Apps, isLoading, error } = state
  layer2Apps = []
  // layer2Apps = [{ name: "Rock Paper Scissors",
  // 		  address: "0x0000000000000000000",
  // 		  symbol: "RPS"},
  // 		{ name: "MetaMask Pay",
  // 		  address: "0x0000000000000000001",
  // 		  symbol:"MMP"}]
  console.log("DEBUG", state)  
  console.log("DEBUG", layer2Apps)
  if (isLoading) {
    return this.message(this.context.t('loadingLayer2Apps'))
  }

  if (error) {
    log.error(error)
    return h('.hotFix', {
      style: {
        padding: '80px',
      },
    }, [
      this.context.t('troubleTokenBalances'),
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
      }, this.context.t('here')),
    ])
  }

  return h('div', layer2Apps.map((layer2AppData) => {
    layer2AppData.image = assetImages[layer2AppData.address]
    return h(Layer2AppCell, layer2AppData)
  }))

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
    layer2Apps: this.props.layer2Apps,
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

TokenList.prototype.componentDidUpdate = function (nextProps) {
  const {
    network: oldNet,
    userAddress: oldAddress,
    layer2Apps,
  } = this.props
  const {
    network: newNet,
    userAddress: newAddress,
    layer2Apps: newLayer2Apps,
  } = nextProps

  const isLoading = newNet === 'loading'
  const missingInfo = !oldNet || !newNet || !oldAddress || !newAddress
  const sameUserAndNetwork = oldAddress === newAddress && oldNet === newNet
  const shouldUpdateLayer2Apps = isLoading || missingInfo || sameUserAndNetwork

  const oldLayer2AppsLength = layer2Apps ? layer2Apps.length : 0
  const layer2AppsLengthUnchanged = oldLayer2AppsLength === newLayer2Apps.length

  if (layer2AppsLengthUnchanged && shouldUpdateLayer2Apps) return

  this.setState({ isLoading: true })
  this.createFreshTokenTracker()
}

TokenList.prototype.updateBalances = function (layer2Apps) {
  if (!this.tracker.running) {
    return
  }
  this.setState({ layer2Apps, isLoading: false })
}

TokenList.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
  this.tracker.removeListener('update', this.balanceUpdater)
  this.tracker.removeListener('error', this.showError)
}

