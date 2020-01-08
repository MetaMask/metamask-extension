const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
import Identicon from '../ui/identicon'
const prefixForNetwork = require('../../../lib/etherscan-prefix-for-network')
const selectors = require('../../selectors/selectors')
const actions = require('../../store/actions')
const { conversionUtil, multiplyCurrencies } = require('../../helpers/utils/conversion-util')

const TokenMenuDropdown = require('./dropdowns/token-menu-dropdown.js')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    currentCurrency: state.metamask.currentCurrency,
    selectedTokenAddress: state.metamask.selectedTokenAddress,
    userAddress: selectors.getSelectedAddress(state),
    contractExchangeRates: state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate,
    sidebarOpen: state.appState.sidebar.isOpen,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setSelectedToken: address => dispatch(actions.setSelectedToken(address)),
    hideSidebar: () => dispatch(actions.hideSidebar()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(TokenCell)

inherits(TokenCell, Component)
function TokenCell () {
  Component.call(this)

  this.state = {
    tokenMenuOpen: false,
  }
}

TokenCell.contextTypes = {
  metricsEvent: PropTypes.func,
}

TokenCell.prototype.render = function () {
  const { tokenMenuOpen } = this.state
  const props = this.props
  const {
    address,
    symbol,
    string,
    network,
    setSelectedToken,
    selectedTokenAddress,
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
    h('div.token-list-item', {
      className: `token-list-item ${selectedTokenAddress === address ? 'token-list-item--active' : ''}`,
      // style: { cursor: network === '1' ? 'pointer' : 'default' },
      // onClick: this.view.bind(this, address, userAddress, network),
      onClick: () => {
        setSelectedToken(address)
        this.context.metricsEvent({
          eventOpts: {
            category: 'Navigation',
            action: 'Token Menu',
            name: 'Clicked Token',
          },
        })
        selectedTokenAddress !== address && sidebarOpen && hideSidebar()
      },
    }, [

      h(Identicon, {
        className: 'token-list-item__identicon',
        diameter: 50,
        address,
        network,
        image,
      }),

      h('div.token-list-item__balance-ellipsis', null, [
        h('div.token-list-item__balance-wrapper', null, [
          h('div.token-list-item__token-balance', `${string || 0}`),
          h('div.token-list-item__token-symbol', symbol),
          showFiat && h('div.token-list-item__fiat-amount', {
            style: {},
          }, formattedFiat),
        ]),

        h('i.fa.fa-ellipsis-h.fa-lg.token-list-item__ellipsis.cursor-pointer', {
          onClick: (e) => {
            e.stopPropagation()
            this.setState({ tokenMenuOpen: true })
          },
        }),

      ]),


      tokenMenuOpen && h(TokenMenuDropdown, {
        onClose: () => this.setState({ tokenMenuOpen: false }),
        token: { symbol, address },
      }),

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

TokenCell.prototype.view = function (address, userAddress, network) {
  const url = etherscanLinkFor(address, userAddress, network)
  if (url) {
    navigateTo(url)
  }
}

function navigateTo (url) {
  global.platform.openWindow({ url })
}

function etherscanLinkFor (tokenAddress, address, network) {
  const prefix = prefixForNetwork(network)
  return `https://${prefix}etherscan.io/token/${tokenAddress}?a=${address}`
}

function tokenFactoryFor (tokenAddress) {
  return `https://tokenfactory.surge.sh/#/token/${tokenAddress}`
}

