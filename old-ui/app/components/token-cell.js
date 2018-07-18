const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const inherits = require('util').inherits
const Identicon = require('./identicon')
const prefixForNetwork = require('../../lib/etherscan-prefix-for-network')

module.exports = connect(mapStateToProps)(TokenCell)
function mapStateToProps (state) {
  return {
    settings: state.metamask.settings,
  }
}

inherits(TokenCell, Component)
function TokenCell () {
  Component.call(this)
}

TokenCell.prototype.render = function () {
  const props = this.props
  const { address, symbol, string, network, userAddress } = props

  return (
    h('li.token-cell', {
      style: { cursor: network === '1' ? 'pointer' : 'default' },
      onClick: this.view.bind(this, address, userAddress, network),
    }, [

      h(Identicon, {
        diameter: 50,
        address,
        network,
      }),

      h('h3', `${string || 0} ${symbol}`),

      h('span', { style: { flex: '1 0 auto' } }),

      /*
      h('button', {
        onClick: this.send.bind(this, address),
      }, 'SEND'),
      */

    ])
  )
}

TokenCell.prototype.send = function (address, event) {
  event.preventDefault()
  event.stopPropagation()
  let url
  if (this.props.settings && this.props.settings.blockExplorerTokenFactory) {
    url = this.props.settings.blockExplorerTokenFactory
  }
  url = tokenFactoryFor(address, url)
  if (url) {
    navigateTo(url)
  }
}

TokenCell.prototype.view = function (address, userAddress, network, event) {
  let url
  if (this.props.settings && this.props.settings.blockExplorerToken) {
    url = this.props.settings.blockExplorerToken
  }
  url = etherscanLinkFor(address, userAddress, network, url)
  if (url) {
    navigateTo(url)
  }
}

function navigateTo (url) {
  global.platform.openWindow({ url })
}

function etherscanLinkFor (tokenAddress, address, network, url) {
  if (url) {
    return url.replace('[[tokenAddress]]', tokenAddress).replace('[[address]]', address)
  }

  const prefix = prefixForNetwork(network)
  return `https://${prefix}etherscan.io/token/${tokenAddress}?a=${address}`
}

function tokenFactoryFor (tokenAddress, url) {
  if (url) {
    return url.replace('[[tokenAddress]]', tokenAddress)
  }

  return `https://tokenfactory.surge.sh/#/token/${tokenAddress}`
}

