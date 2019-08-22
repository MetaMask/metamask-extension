import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Dropdown, DropdownMenuItem } from '../dropdown'
import actions from '../../../../ui/app/actions'
import { LOCALHOST } from '../../../../app/scripts/controllers/network/enums'
import { networks } from '../../../../app/scripts/controllers/network/util'
import ethNetProps from 'eth-net-props'
import { connect } from 'react-redux'

const LOCALHOST_RPC_URL = 'http://localhost:8545'

class NetworksMenu extends Component {
  static propTypes = {
    showConfigPage: PropTypes.func.isRequired,
    setRpcTarget: PropTypes.func.isRequired,
    updateNetworksMenuOpenState: PropTypes.func.isRequired,
    provider: PropTypes.any.isRequired,
    frequentRpcList: PropTypes.array.isRequired,
    isNetworkMenuOpen: PropTypes.bool,
  }

  render () {
    const props = this.props
    const { provider: { type: providerType } } = props
    const rpcList = props.frequentRpcList
    const isOpen = props.isNetworkMenuOpen

    const knownNetworks = Object.keys(networks)
    .filter((networkID) => {
      return !isNaN(networkID)
    })

    const sortedNetworks = knownNetworks
    .sort(this._sortNetworks)
    const networksView = this._renderNetworksView(sortedNetworks)

    return (
      <Dropdown
        useCssTransition={true}
        isOpen={isOpen}
        onClickOutside={(event) => {
          const { classList } = event.target
          const isNotToggleElement = [
            classList.contains('menu-icon'),
            classList.contains('network-name'),
            classList.contains('network-indicator'),
          ].filter(bool => bool).length === 0
          // classes from three constituent nodes of the toggle element

          if (isNotToggleElement) {
            this.props.updateNetworksMenuOpenState(false)
          }
        }}
        zIndex={11}
        style={{
          position: 'absolute',
          left: '2px',
          top: '38px',
          width: '270px',
          maxHeight: isOpen ? '524px' : '0px',
        }}
        innerStyle={{
          padding: '2px 16px 2px 0px',
        }}
      >

        {networksView}

        <DropdownMenuItem
          key={'default'}
          closeMenu={() => this.props.updateNetworksMenuOpenState(!isOpen)}
          onClick={() => {
            props.setProviderType(LOCALHOST, LOCALHOST_RPC_URL)
            props.setRpcTarget(LOCALHOST_RPC_URL)
          }}
          style={{
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === LOCALHOST ? 'white' : '',
          }}
        >
          {providerType === LOCALHOST ? <div className="selected-network" /> : null}
          {`Localhost 8545`}
        </DropdownMenuItem>

        <DropdownMenuItem
          closeMenu={() => this.props.updateNetworksMenuOpenState(!isOpen)}
          onClick={() => this.props.showConfigPage()}
          className={'app-bar-networks-dropdown-custom-rpc'}
        >Custom RPC</DropdownMenuItem>

        {this.renderSelectedCustomOption(props.provider)}
        {this.renderCommonRpc(rpcList, props.provider)}
      </Dropdown>
    )
  }

  _renderNetworksView (_networks) {
    const props = this.props
    const { provider: { type: providerType } } = props
    const state = this.state || {}
    const isOpen = state.isNetworkMenuOpen

    const networkDropdownItems = _networks
    .map((networkID) => {
      const networkObj = networks[networkID]
      return (
        <DropdownMenuItem
          key={networkObj.providerName}
          closeMenu={() => this.props.updateNetworksMenuOpenState(!isOpen)}
          onClick={() => props.setProviderType(networkObj.providerName)}
          style={{
            paddingLeft: '20px',
            color: providerType === networkObj.providerName ? 'white' : '',
          }}
        >
          {providerType === networkObj.providerName ? <div className="selected-network" /> : null}
          {ethNetProps.props.getNetworkDisplayName(networkID)}
        </DropdownMenuItem>
      )
    })

    return networkDropdownItems
  }

  _sortNetworks (networkID1, networkID2) {
    const networkObj1 = networks[networkID1]
    const networkObj2 = networks[networkID2]
    return networkObj1.order - networkObj2.order
  }

  renderCustomOption ({ rpcTarget, type }) {
    if (type !== 'rpc') {
      return null
    }

    // Concatenate long URLs
    let label = rpcTarget
    if (rpcTarget.length > 31) {
      label = label.substr(0, 34) + '...'
    }

    switch (rpcTarget) {
      case LOCALHOST_RPC_URL:
        return null
      default:
        return (
          <DropdownMenuItem
            key={rpcTarget}
            onClick={() => this.props.setRpcTarget(rpcTarget)}
            closeMenu={() => this.props.updateNetworksMenuOpenState(false)}
          >
            <i className="fa fa-question-circle fa-lg menu-icon" />
            {label}
            <div className="check">✓</div>
          </DropdownMenuItem>
        )
    }
  }

  renderCommonRpc (rpcList, provider) {
    const props = this.props
    const { rpcTarget, type } = provider

    return rpcList.map((rpc) => {
      if (type === 'rpc' && rpc === rpcTarget) {
        return null
      } else {
        return (
          <DropdownMenuItem
            key={`common${rpc}`}
            closeMenu={() => this.props.updateNetworksMenuOpenState(false)}
            onClick={() => props.setRpcTarget(rpc)}
            style={{
              paddingLeft: '20px',
            }}
          >
            <span className="custom-rpc">{rpc}</span>
            <div
              className="remove"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                this.props.updateNetworksMenuOpenState(false)
                props.showDeleteRPC(rpc)
              }}
            />
          </DropdownMenuItem>
        )
      }
    })
  }

  renderSelectedCustomOption (provider) {
    const { rpcTarget, type } = provider
    const props = this.props
    if (type !== 'rpc') return null

    // Concatenate long URLs
    let label = rpcTarget
    if (rpcTarget.length > 31) {
      label = label.substr(0, 34) + '...'
    }

    switch (rpcTarget) {
      default:
        return (
          <DropdownMenuItem
            key={rpcTarget}
            onClick={() => props.setRpcTarget(rpcTarget)}
            closeMenu={() => this.props.updateNetworksMenuOpenState(false)}
            style={{
              paddingLeft: '20px',
              color: 'white',
            }}
          >
            <div className="selected-network" />
            <span className="custom-rpc">{label}</span>
            <div
              className="remove"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                this.props.updateNetworksMenuOpenState(false)
                props.showDeleteRPC(label)
              }}
            />
          </DropdownMenuItem>
        )
    }
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showConfigPage: () => dispatch(actions.showConfigPage()),
    setRpcTarget: (rpcTarget) => dispatch(actions.setRpcTarget(rpcTarget)),
    setProviderType: (providerType) => dispatch(actions.setProviderType(providerType)),
    showDeleteRPC: (label) => dispatch(actions.showDeleteRPC(label)),
  }
}

export default connect(null, mapDispatchToProps)(NetworksMenu)
