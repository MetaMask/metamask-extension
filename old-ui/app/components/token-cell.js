const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const ethNetProps = require('eth-net-props')

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
      style: {
        cursor: network === '1' ? 'pointer' : 'default',
        borderBottom: props.isLastTokenCell ? 'none' : '1px solid #e2e2e2',
        padding: '20px 0',
        margin: '0 30px',
      },
      onClick: this.view.bind(this, address, userAddress, network),
    }, [

      h(Identicon, {
        diameter: 50,
        address,
        network,
      }),

      h('h3', {
        style: {
          fontFamily: 'Nunito Bold',
          fontSize: '14px',
        },
      }, `${string || 0} ${symbol}`),

      h('span', { style: { flex: '1 0 auto' } }),

      h('span.trash', {
        style: { cursor: 'pointer' },
        onClick: (event) => {
          event.stopPropagation()
          this.props.removeToken({ address, symbol, string, network, userAddress })
        },
      }, ''),

      h('hr'),

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
  const url = tokenFactoryFor(address)
  if (url) {
    navigateTo(url)
  }
}

TokenCell.prototype.view = function (address, userAddress, network, event) {
  const url = ethNetProps.explorerLinks.getExplorerTokenLinkFor(address, userAddress, network)
  if (url) {
    navigateTo(url)
  }
}

function navigateTo (url) {
  global.platform.openWindow({ url })
}

function tokenFactoryFor (tokenAddress) {
  return `https://tokenfactory.surge.sh/#/token/${tokenAddress}`
}

