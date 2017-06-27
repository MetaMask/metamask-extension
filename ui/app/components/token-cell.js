const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')

module.exports = TokenCell

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
      onClick: (event) => {
        const url = urlFor(address, userAddress, network)
        if (url) {
          navigateTo(url)
        }
      },
    }, [

      h(Identicon, {
        diameter: 50,
        address,
        network,
      }),

      h('h3', `${string || 0} ${symbol}`),
    ])
  )
}

function navigateTo (url) {
  global.platform.openWindow({ url })
}

function urlFor (tokenAddress, address, network) {
  return `https://etherscan.io/token/${tokenAddress}?a=${address}`
}

