const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = DropMenuItem

inherits(DropMenuItem, Component)
function DropMenuItem () {
  Component.call(this)
}

DropMenuItem.prototype.render = function () {
  return h('li.drop-menu-item', {
    onClick: () => {
      this.props.closeMenu()
      this.props.action()
    },
    style: {
      listStyle: 'none',
      padding: '6px 16px 6px 5px',
      fontFamily: 'Montserrat Regular',
      color: 'rgb(125, 128, 130)',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'flex-start',
    },
  }, [
    this.props.icon,
    this.props.label,
    this.activeNetworkRender(),
  ])
}

DropMenuItem.prototype.activeNetworkRender = function () {
  let activeNetwork = this.props.activeNetworkRender
  let { provider } = this.props
  let providerType = provider ? provider.type : null
  if (activeNetwork === undefined) return

  switch (this.props.label) {
    case 'Main Ethereum Network':
      if (providerType === 'mainnet') return h('.check', '✓')
      break
    case 'Ethereum Classic Network':
      if (providerType === 'classic') return h('.check', '✓')
      break
    case 'Morden Test Network':
      if (activeNetwork === '2') return h('.check', '✓')
      break
    case 'Localhost 8545':
      if (activeNetwork === 'http://localhost:8545') return h('.check', '✓')
      break
    default:
      if (activeNetwork === 'custom') return h('.check', '✓')
  }
}
