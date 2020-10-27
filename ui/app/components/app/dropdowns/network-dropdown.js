import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import * as actions from '../../../store/actions'
import { Dropdown, DropdownMenuItem } from './components/dropdown'
import NetworkDropdownIcon from './components/network-dropdown-icon'
import R from 'ramda'
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes'

// classes from nodes of the toggle element.
const notToggleElementClassnames = [
  'menu-icon',
  'network-name',
  'network-indicator',
  'network-caret',
  'network-component',
]

function mapStateToProps (state) {
  return {
    provider: state.metamask.provider,
    frequentRpcListDetail: state.metamask.frequentRpcListDetail || [],
    networkDropdownOpen: state.appState.networkDropdownOpen,
    network: state.metamask.network,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type))
    },
    setRpcTarget: (target, network, ticker, nickname) => {
      dispatch(actions.setRpcTarget(target, network, ticker, nickname))
    },
    delRpcTarget: (target) => {
      dispatch(actions.delRpcTarget(target))
    },
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    setNetworksTabAddMode: (isInAddMode) =>
      dispatch(actions.setNetworksTabAddMode(isInAddMode)),
  }
}

class NetworkDropdown extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    provider: PropTypes.shape({
      type: PropTypes.string,
      ticker: PropTypes.string,
    }).isRequired,
    setProviderType: PropTypes.func.isRequired,
    network: PropTypes.string.isRequired,
    setRpcTarget: PropTypes.func.isRequired,
    hideNetworkDropdown: PropTypes.func.isRequired,
    setNetworksTabAddMode: PropTypes.func.isRequired,
    frequentRpcListDetail: PropTypes.array.isRequired,
    networkDropdownOpen: PropTypes.bool.isRequired,
    history: PropTypes.object.isRequired,
  }

  handleClick (newProviderType) {
    const {
      provider: { type: providerType },
      setProviderType,
    } = this.props
    const { metricsEvent } = this.context

    metricsEvent({
      eventOpts: {
        category: 'Navigation',
        action: 'Home',
        name: 'Switched Networks',
      },
      customVariables: {
        fromNetwork: providerType,
        toNetwork: newProviderType,
      },
    })
    setProviderType(newProviderType)
  }

  renderCustomOption (provider) {
    const { rpcTarget, type, ticker, nickname } = provider
    const network = this.props.network

    if (type !== 'rpc') {
      return null
    }

    switch (rpcTarget) {
      case 'http://localhost:12537':
        return null

      default:
        return (
          <DropdownMenuItem
            key={rpcTarget}
            onClick={() =>
              this.props.setRpcTarget(rpcTarget, network, ticker, nickname)
            }
            closeMenu={() => this.props.hideNetworkDropdown()}
            style={{
              fontSize: '16px',
              lineHeight: '20px',
              padding: '12px 0',
            }}
          >
            <i className="fa fa-check" />
            <i className="fa fa-question-circle fa-med menu-icon-circle" />
            <span
              className="network-name-item"
              style={{
                color: '#ffffff',
              }}
            >
              {nickname || rpcTarget}
            </span>
          </DropdownMenuItem>
        )
    }
  }

  renderCommonRpc (rpcListDetail, provider) {
    const props = this.props
    const reversedRpcListDetail = rpcListDetail.slice().reverse()

    return reversedRpcListDetail.map((entry) => {
      const rpc = entry.rpcUrl
      const ticker = entry.ticker || 'CFX'
      const nickname = entry.nickname || ''
      const currentRpcTarget =
        provider.type === 'rpc' && rpc === provider.rpcTarget

      if (rpc === 'http://localhost:12537' || currentRpcTarget) {
        return null
      } else {
        const chainId = entry.chainId
        return (
          <DropdownMenuItem
            key={`common${rpc}`}
            closeMenu={() => this.props.hideNetworkDropdown()}
            onClick={() => props.setRpcTarget(rpc, chainId, ticker, nickname)}
            style={{
              fontSize: '16px',
              lineHeight: '20px',
              padding: '12px 0',
            }}
          >
            {currentRpcTarget ? (
              <i className="fa fa-check" />
            ) : (
              <div className="network-check__transparent">✓</div>
            )}
            <i className="fa fa-question-circle fa-med menu-icon-circle" />
            <span
              className="network-name-item"
              style={{
                color: currentRpcTarget ? '#ffffff' : '#9b9b9b',
              }}
            >
              {nickname || rpc}
            </span>
            <i
              className="fa fa-times delete"
              onClick={(e) => {
                e.stopPropagation()
                props.delRpcTarget(rpc)
              }}
            />
          </DropdownMenuItem>
        )
      }
    })
  }

  getNetworkName () {
    const { provider } = this.props
    const providerName = provider.type

    let name

    if (providerName === 'mainnet') {
      const MAINNET_LANCHED =
        new Date().getTime() >
        new Date(
          'Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)'
        ).getTime()
      name = this.context.t('mainnet')
      if (MAINNET_LANCHED) {
        name = name.replace('Oceanus', 'Tethys')
      }
    } else if (providerName === 'testnet') {
      name = this.context.t('testnet')
    } else {
      name = provider.nickname || this.context.t('unknownNetwork')
    }

    return name
  }

  render () {
    const {
      provider: { type: providerType, rpcTarget: activeNetwork },
      setNetworksTabAddMode,
    } = this.props
    const rpcListDetail = this.props.frequentRpcListDetail
    const isOpen = this.props.networkDropdownOpen
    const dropdownMenuItemStyle = {
      fontSize: '16px',
      lineHeight: '20px',
      padding: '12px 0',
    }

    const MAINNET_LANCHED =
      new Date().getTime() >
      new Date(
        'Thu Oct 29 2020 00:10:00 GMT+0800 (China Standard Time)'
      ).getTime()
    return (
      <Dropdown
        isOpen={isOpen}
        onClickOutside={(event) => {
          const { classList } = event.target
          const isInClassList = (className) => classList.contains(className)
          const notToggleElementIndex = R.findIndex(isInClassList)(
            notToggleElementClassnames
          )

          if (notToggleElementIndex === -1) {
            this.props.hideNetworkDropdown()
          }
        }}
        containerClassName="network-droppo"
        zIndex={55}
        style={{
          position: 'absolute',
          top: '58px',
          width: '309px',
          zIndex: '55px',
        }}
        innerStyle={{
          padding: '18px 8px',
        }}
      >
        <div className="network-dropdown-header">
          <div className="network-dropdown-title">
            {this.context.t('networks')}
          </div>
          <div className="network-dropdown-divider" />
          <div className="network-dropdown-content">
            {!MAINNET_LANCHED && this.context.t('defaultNetwork')}
            {MAINNET_LANCHED &&
              this.context.t('defaultNetwork').replace('Oceanus', 'Tethys')}
          </div>
        </div>
        <DropdownMenuItem
          key="main"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('mainnet')}
          style={{ ...dropdownMenuItemStyle, borderColor: '#038789' }}
        >
          {providerType === 'mainnet' ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            backgroundColor="#29B6AF"
            isSelected={providerType === 'mainnet'}
          />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'mainnet' ? '#ffffff' : '#9b9b9b',
            }}
          >
            {!MAINNET_LANCHED && this.context.t('mainnet')}
            {MAINNET_LANCHED &&
              this.context.t('mainnet').replace('Oceanus', 'Tethys')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="testnet"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('testnet')}
          style={dropdownMenuItemStyle}
        >
          {providerType === 'testnet' ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            backgroundColor="#ff4a8d"
            isSelected={providerType === 'testnet'}
          />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'testnet' ? '#ffffff' : '#9b9b9b',
            }}
          >
            {this.context.t('testnet')}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          key="default"
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => this.handleClick('localhost')}
          style={dropdownMenuItemStyle}
        >
          {providerType === 'localhost' ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            isSelected={providerType === 'localhost'}
            innerBorder="1px solid #9b9b9b"
          />
          <span
            className="network-name-item"
            style={{
              color: providerType === 'localhost' ? '#ffffff' : '#9b9b9b',
            }}
          >
            {this.context.t('localhost')}
          </span>
        </DropdownMenuItem>
        {this.renderCustomOption(this.props.provider)}
        {this.renderCommonRpc(rpcListDetail, this.props.provider)}
        <DropdownMenuItem
          closeMenu={() => this.props.hideNetworkDropdown()}
          onClick={() => {
            setNetworksTabAddMode(true)
            this.props.history.push(NETWORKS_ROUTE)
          }}
          style={dropdownMenuItemStyle}
        >
          {activeNetwork === 'custom' ? (
            <i className="fa fa-check" />
          ) : (
            <div className="network-check__transparent">✓</div>
          )}
          <NetworkDropdownIcon
            isSelected={activeNetwork === 'custom'}
            innerBorder="1px solid #9b9b9b"
          />
          <span
            className="network-name-item"
            style={{
              color: activeNetwork === 'custom' ? '#ffffff' : '#9b9b9b',
            }}
          >
            {this.context.t('customRPC')}
          </span>
        </DropdownMenuItem>
      </Dropdown>
    )
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NetworkDropdown)
