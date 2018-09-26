const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const ethNetProps = require('eth-net-props')
const Dropdown = require('./dropdown').Dropdown
const DropdownMenuItem = require('./dropdown').DropdownMenuItem
const ethUtil = require('ethereumjs-util')
const copyToClipboard = require('copy-to-clipboard')
const actions = require('../../../ui/app/actions')
const connect = require('react-redux').connect

const tokenCellDropDownPrefix = 'token-cell_dropdown_'

inherits(TokenCell, Component)
function TokenCell () {
  Component.call(this)

  this.state = {
    optionsMenuActive: false,
  }
  this.optionsMenuToggleClassName = 'token-dropdown'
}

TokenCell.prototype.render = function () {
  const { address, symbol, string, network, userAddress, isLastTokenCell, menuToTop, ind } = this.props
  const { optionsMenuActive } = this.state

  return (
    h(`li#token-cell_${ind}.token-cell`, {
      style: {
        cursor: network === '1' ? 'pointer' : 'default',
        borderBottom: isLastTokenCell ? 'none' : '1px solid #e2e2e2',
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

      h(`div#${tokenCellDropDownPrefix}${ind}.address-dropdown.token-dropdown`,
        {
          style: { cursor: 'pointer' },
          onClick: (event) => {
            event.stopPropagation()
            this.setState({
              optionsMenuActive: !optionsMenuActive,
            })
          },
        },
        this.renderTokenOptions(menuToTop, ind)
      ),

      /*
      h('button', {
        onClick: this.send.bind(this, address),
      }, 'SEND'),
      */

    ])
  )
}

TokenCell.prototype.renderTokenOptions = function (menuToTop, ind) {
  const { address, symbol, string, network, userAddress, showSendTokenPage } = this.props
  const { optionsMenuActive } = this.state

  return h(
    Dropdown,
    {
      style: {
        position: 'relative',
        marginLeft: '-263px',
        minWidth: '180px',
        marginTop: menuToTop ? '-200px' : '30px',
        width: '280px',
      },
      isOpen: optionsMenuActive,
      onClickOutside: (event) => {
        const { classList, id: targetID } = event.target
        const isNotToggleCell = !classList.contains(this.optionsMenuToggleClassName)
        const isAnotherCell = targetID !== `${tokenCellDropDownPrefix}${ind}`
        if (optionsMenuActive && (isNotToggleCell || (!isNotToggleCell && isAnotherCell))) {
          this.setState({ optionsMenuActive: false })
        }
      },
    },
    [
      h(
        DropdownMenuItem,
        {
          closeMenu: () => {},
          onClick: () => {
            showSendTokenPage(address)
          },
        },
        `Send`,
      ),
      h(
        DropdownMenuItem,
        {
          closeMenu: () => {},
          onClick: () => {
            const { network } = this.props
            const url = ethNetProps.explorerLinks.getExplorerTokenLinkFor(address, userAddress, network)
            global.platform.openWindow({ url })
          },
        },
        `View token on block explorer`,
      ),
      h(
        DropdownMenuItem,
        {
          closeMenu: () => {},
          onClick: () => {
            const checkSumAddress = address && ethUtil.toChecksumAddress(address)
            copyToClipboard(checkSumAddress)
          },
        },
        'Copy address to clipboard',
      ),
      h(
        DropdownMenuItem,
        {
          closeMenu: () => {},
          onClick: () => {
            this.props.removeToken({ address, symbol, string, network, userAddress })
          },
        },
        'Remove',
      ),
    ]
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

const mapDispatchToProps = dispatch => {
  return {
    showSendTokenPage: (tokenAddress) => dispatch(actions.showSendTokenPage(tokenAddress)),
  }
}

module.exports = connect(null, mapDispatchToProps)(TokenCell)

