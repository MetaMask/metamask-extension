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
  let currentTokenToFiatRate
  let currentTokenInFiat
  let formattedFiat = ''

  if (contractExchangeRates[address]) {
    currentTokenToFiatRate = multiplyCurrencies(
      contractExchangeRates[address],
      conversionRate
    )
    currentTokenInFiat = conversionUtil(string, {
      fromNumericBase: 'dec',
      fromCurrency: symbol,
      toCurrency: currentCurrency.toUpperCase(),
      numberOfDecimals: 2,
      conversionRate: currentTokenToFiatRate,
    })
    formattedFiat = currentTokenInFiat.toString() === '0'
      ? ''
      : `${currentTokenInFiat} ${currentCurrency.toUpperCase()}`
  }

  const showFiat = Boolean(currentTokenInFiat) && currentCurrency.toUpperCase() !== symbol

  return (
    h('div.layer2App-list-item', {
      className: `layer2App-list-item ${selectedTokenAddress === address ? 'layer2App-list-item--active' : ''}`,
      // style: { cursor: network === '1' ? 'pointer' : 'default' },
      // onClick: this.view.bind(this, address, userAddress, network),
      onClick: () => {
        setSelectedToken(address)
        setSelectedLayer2AppAddress(address)	
        selectedTokenAddress !== address && sidebarOpen && hideSidebar()
      },
    }, [

      h(Identicon, {
        className: 'layer2App-list-item__identicon',
        diameter: 50,
        address,
        network,
        image,
      }),

      h('div.layer2App-list-item__balance-ellipsis', null, [
        h('div.layer2App-list-item__balance-wrapper', null, [
          h('div.layer2App-list-item__layer2App-balance', `${string || 0}` + ' ETH locked'),
          h('div.layer2App-list-item__layer2App-symbol', symbol),
          h('div.layer2App-list-item__layer2App-name', name),
          showFiat && h('div.layer2App-list-item__fiat-amount', {
            style: {},
          }, formattedFiat),
        ]),

        h('i.fa.fa-ellipsis-h.fa-lg.layer2App-list-item__ellipsis.cursor-pointer', {
          onClick: (e) => {
            e.stopPropagation()
            this.setState({ layer2AppMenuOpen: true })
          },
        }),

      ]),


      layer2AppMenuOpen && h(Layer2AppMenuDropdown, {
        onClose: () => this.setState({ layer2AppMenuOpen: false }),
        layer2App: { symbol, address },
      }),

      /*
      h('button', {
        onClick: this.send.bind(this, address),
      }, 'SEND'),
      */

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

