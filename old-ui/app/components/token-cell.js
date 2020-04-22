import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Identicon from './identicon'
import ethNetProps from 'eth-net-props'
import { Dropdown, DropdownMenuItem } from './dropdown'
import copyToClipboard from 'copy-to-clipboard'
import { connect } from 'react-redux'
import { countSignificantDecimals, toChecksumAddress } from '../util'
import actions from '../../../ui/app/actions'
const { MAINNET_CODE } = require('../../../app/scripts/controllers/network/enums')

const tokenCellDropDownPrefix = 'token-cell_dropdown_'

class TokenCell extends Component {
  static propTypes = {
    address: PropTypes.string,
    symbol: PropTypes.string,
    string: PropTypes.string,
    network: PropTypes.string,
    ind: PropTypes.number,
    showSendTokenPage: PropTypes.func,
    isLastTokenCell: PropTypes.bool,
    userAddress: PropTypes.string,
    menuToTop: PropTypes.bool,
    removeToken: PropTypes.func,
  }

  constructor () {
    super()

    this.state = {
      optionsMenuActive: false,
    }
    this.optionsMenuToggleClassName = 'token-dropdown'
  }

  render () {
    const { address, symbol, string, network, userAddress, isLastTokenCell, menuToTop, ind } = this.props
    const { optionsMenuActive } = this.state

    const tokenBalanceRaw = Number.parseFloat(string)
    const tokenBalance = tokenBalanceRaw.toFixed(countSignificantDecimals(tokenBalanceRaw, 2))

    return (
      <li
        id={`token-cell_${ind}`}
        className="token-cell"
        style= {{
          cursor: Number(network) === MAINNET_CODE ? 'pointer' : 'default',
          borderBottom: isLastTokenCell ? 'none' : '1px solid #e2e2e2',
          padding: '20px 0',
          margin: '0 30px',
        }}
        key={`token-cell_${ind}`}
        onClick= {this.view.bind(this, address, userAddress, network)}
      >
        <Identicon
          diameter= {50}
          address={address}
          network={network}
        />

        <h3
          style= {{
            fontFamily: 'Nunito Bold',
            fontSize: '14px',
          }}
        >
          {`${tokenBalance || 0} ${symbol}`}
        </h3>

        <span
          style= {{ flex: '1 0 auto' }}
        />

        <div
          id={`${tokenCellDropDownPrefix}${ind}`}
          className="address-dropdown token-dropdown"
          style= {{ cursor: 'pointer' }}
          onClick= {(event) => {
              event.stopPropagation()
              this.setState({
                optionsMenuActive: !optionsMenuActive,
              })
            }}
        >
          {this.renderTokenOptions(menuToTop, ind)}
        </div>
      </li>
    )
  }

  renderTokenOptions (menuToTop, ind) {
    const { address, symbol, string, network, userAddress, showSendTokenPage } = this.props
    const { optionsMenuActive } = this.state

    return (
    <Dropdown
      style= {{
        position: 'relative',
        marginLeft: menuToTop ? '-273px' : '-263px',
        minWidth: '180px',
        marginTop: menuToTop ? '-214px' : '30px',
        width: '280px',
      }}
      isOpen={optionsMenuActive}
      onClickOutside={(event) => {
        const { classList, id: targetID } = event.target
        const isNotToggleCell = !classList.contains(this.optionsMenuToggleClassName)
        const isAnotherCell = targetID !== `${tokenCellDropDownPrefix}${ind}`
        if (optionsMenuActive && (isNotToggleCell || (!isNotToggleCell && isAnotherCell))) {
          this.setState({ optionsMenuActive: false })
        }
      }}
    >
        <DropdownMenuItem
            closeMenu={() => {}}
            onClick={() => {
              showSendTokenPage(address)
            }}
        >
          Send
        </DropdownMenuItem>
        <DropdownMenuItem
            closeMenu={() => {}}
            onClick={() => {
              const { network } = this.props
              const url = ethNetProps.explorerLinks.getExplorerTokenLinkFor(address, userAddress, network)
              global.platform.openWindow({ url })
            }}
        >
          View token on block explorer
        </DropdownMenuItem>
        <DropdownMenuItem
            closeMenu={() => {}}
            onClick={() => {
              const checkSumAddress = address && toChecksumAddress(network, address)
              copyToClipboard(checkSumAddress)
            }}
        >
          Copy address to clipboard
        </DropdownMenuItem>
        <DropdownMenuItem
            closeMenu={() => {}}
            onClick={() => {
              this.props.removeToken({ address, symbol, string, network, userAddress })
            }}
        >
          Remove
        </DropdownMenuItem>
    </Dropdown>
    )
  }

  send (address, event) {
    event.preventDefault()
    event.stopPropagation()
    const url = tokenFactoryFor(address)
    navigateTo(url)
  }

  view (address, userAddress, network, _event) {
    const url = ethNetProps.explorerLinks.getExplorerTokenLinkFor(address, userAddress, network)
    if (url) {
      navigateTo(url)
    }
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

