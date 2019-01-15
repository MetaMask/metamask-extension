const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const Identicon = require('./identicon')
const prefixForNetwork = require('../../lib/etherscan-prefix-for-network')
const selectors = require('../selectors')
const actions = require('../actions')
const { conversionUtil, multiplyCurrencies } = require('../conversion-util')

const Layer2AppMenuDropdown = require('./dropdowns/layer2App-menu-dropdown.js')

function mapStateToProps (state) {
  return {
    layer2AppsScripts: state.metamask.layer2AppsScripts,
    network: state.metamask.network,
    currentCurrency: state.metamask.currentCurrency,
    selectedTokenAddress: state.metamask.selectedTokenAddress,
    selectedLayer2AppAddress: state.metamask.selectedLayer2AppAddress,    
    userAddress: selectors.getSelectedAddress(state),
    contractExchangeRates: state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate,
    sidebarOpen: state.appState.sidebar.isOpen,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setSelectedToken: address => dispatch(actions.setSelectedToken(address)),
    setSelectedLayer2AppAddress: address => dispatch(actions.setSelectedLayer2AppAddress(address)),    
    hideSidebar: () => dispatch(actions.hideSidebar()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Layer2AppCell)

inherits(Layer2AppCell, Component)
function Layer2AppCell () {
  Component.call(this)

  this.state = {
    layer2AppMenuOpen: false,
  }
}

Layer2AppCell.prototype.render = function () {
  const { layer2AppMenuOpen } = this.state
  const props = this.props
  const {
    address,
    name,
    nodeUrl,
    symbol,
    string,
    network,
    setSelectedToken,
    selectedTokenAddress,
    setSelectedLayer2AppAddress,
    selectedLayer2App,
    contractExchangeRates,
    conversionRate,
    hideSidebar,
    sidebarOpen,
    currentCurrency,
    // userAddress,
    image,
  } = props
  console.log(this.props)


  return (
    h('div.layer2App-list-item', {
      className: `layer2App-list-item ${selectedTokenAddress === address ? 'layer2App-list-item--active' : ''}`,
      onClick: () => {
        setSelectedToken(address)
        setSelectedLayer2AppAddress(address)	
        selectedTokenAddress !== address && sidebarOpen && hideSidebar()
      },
    }, [
      h('div', name),
      h('div', address),
      h('div', "node: " + nodeUrl),
      
      h('div', string + " ETH locked"),
      
      h('i.fa.fa-ellipsis-h.fa-lg.layer2App-list-item__ellipsis.cursor-pointer', {
          onClick: (e) => {
            e.stopPropagation()
            this.setState({ layer2AppMenuOpen: true })
          },
        }),
      layer2AppMenuOpen && h(Layer2AppMenuDropdown, {
        onClose: () => this.setState({ layer2AppMenuOpen: false }),
        layer2App: { name, address, nodeUrl },
      }),
    ])
  )
}

Layer2AppCell.prototype.send = function (address, event) {
  event.preventDefault()
  event.stopPropagation()
  // const url = tokenFactoryFor(address)
  // if (url) {
  //   navigateTo(url)
  // }
}

Layer2AppCell.prototype.view = function (address, userAddress, network, event) {
  const url = etherscanLinkFor(address, userAddress, network)
  if (url) {
    navigateTo(url)
  }
}

function navigateTo (url) {
  global.platform.openWindow({ url })
}

function etherscanLinkFor (layer2AppAddress, address, network) {
  const prefix = prefixForNetwork(network)
  return `https://${prefix}etherscan.io/token/${layer2AppAddress}?a=${address}`
}

