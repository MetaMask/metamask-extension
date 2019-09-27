const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const actions = require('../../../store/actions')
const Dropdown = require('./components/dropdown').Dropdown
const DropdownMenuItem = require('./components/dropdown').DropdownMenuItem
const NetworkDropdownIcon = require('./components/network-dropdown-icon')
const R = require('ramda')
const { NETWORKS_ROUTE } = require('../../../helpers/constants/routes')
const {
  ROPSTEN,
  RINKEBY,
  KOVAN,
  MAINNET,
  LOCALHOST,
  GOERLI,
  CUSTOM_RPC,
} = require('../../../helpers/constants/network-types')

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
    setDefaultRpcTarget: type => {
      dispatch(actions.setDefaultRpcTarget(type))
    },
    setRpcTarget: (target, network, ticker, nickname) => {
      dispatch(actions.setRpcTarget(target, network, ticker, nickname))
    },
    delRpcTarget: (target) => {
      dispatch(actions.delRpcTarget(target))
    },
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    setNetworksTabAddMode: isInAddMode => dispatch(actions.setNetworksTabAddMode(isInAddMode)),
  }
}


inherits(NetworkDropdown, Component)
function NetworkDropdown () {
  Component.call(this)
}

NetworkDropdown.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NetworkDropdown)


// TODO: specify default props and proptypes
NetworkDropdown.prototype.render = function () {
  const props = this.props
  const { provider: { type: providerType, rpcTarget: activeNetwork }, setNetworksTabAddMode } = props
  const rpcListDetail = props.frequentRpcListDetail
  const isOpen = this.props.networkDropdownOpen
  const dropdownMenuItemStyle = {
    fontSize: '16px',
    lineHeight: '20px',
    padding: '12px 0',
  }

  return h(Dropdown, {
    isOpen,
    onClickOutside: (event) => {
      const { classList } = event.target
      const isInClassList = className => classList.contains(className)
      const notToggleElementIndex = R.findIndex(isInClassList)(notToggleElementClassnames)

      if (notToggleElementIndex === -1) {
        this.props.hideNetworkDropdown()
      }
    },
    containerClassName: 'network-droppo',
    zIndex: 55,
    style: {
      position: 'absolute',
      top: '58px',
      width: '309px',
      zIndex: '55px',
    },
    innerStyle: {
      padding: '18px 8px',
    },
  }, [

    h('div.network-dropdown-header', {}, [
      h('div.network-dropdown-title', {}, this.context.t('networks')),

      h('div.network-dropdown-divider'),

      h('div.network-dropdown-content',
        {},
        this.context.t('defaultNetwork')
      ),
    ]),

    h(
      DropdownMenuItem,
      {
        key: MAINNET,
        closeMenu: () => this.props.hideNetworkDropdown(),
        onClick: () => this.handleClick(MAINNET),
        style: { ...dropdownMenuItemStyle, borderColor: '#038789' },
      },
      [
        providerType === MAINNET ? h('i.fa.fa-check') : h('.network-check__transparent', '✓'),
        h(NetworkDropdownIcon, {
          backgroundColor: '#29B6AF', // $java
          isSelected: providerType === MAINNET,
        }),
        h('span.network-name-item', {
          style: {
            color: providerType === MAINNET ? '#ffffff' : '#9b9b9b',
          },
        }, this.context.t(MAINNET)),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: ROPSTEN,
        closeMenu: () => this.props.hideNetworkDropdown(),
        onClick: () => this.handleClick(ROPSTEN),
        style: dropdownMenuItemStyle,
      },
      [
        providerType === ROPSTEN ? h('i.fa.fa-check') : h('.network-check__transparent', '✓'),
        h(NetworkDropdownIcon, {
          backgroundColor: '#ff4a8d', // $wild-strawberry
          isSelected: providerType === ROPSTEN,
        }),
        h('span.network-name-item', {
          style: {
            color: providerType === ROPSTEN ? '#ffffff' : '#9b9b9b',
          },
        }, this.context.t(ROPSTEN)),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: KOVAN,
        closeMenu: () => this.props.hideNetworkDropdown(),
        onClick: () => this.handleClick(KOVAN),
        style: dropdownMenuItemStyle,
      },
      [
        providerType === KOVAN ? h('i.fa.fa-check') : h('.network-check__transparent', '✓'),
        h(NetworkDropdownIcon, {
          backgroundColor: '#7057ff', // $cornflower-blue
          isSelected: providerType === KOVAN,
        }),
        h('span.network-name-item', {
          style: {
            color: providerType === KOVAN ? '#ffffff' : '#9b9b9b',
          },
        }, this.context.t(KOVAN)),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: RINKEBY,
        closeMenu: () => this.props.hideNetworkDropdown(),
        onClick: () => this.handleClick(RINKEBY),
        style: dropdownMenuItemStyle,
      },
      [
        providerType === RINKEBY ? h('i.fa.fa-check') : h('.network-check__transparent', '✓'),
        h(NetworkDropdownIcon, {
          backgroundColor: '#f6c343', // $saffron
          isSelected: providerType === RINKEBY,
        }),
        h('span.network-name-item', {
          style: {
            color: providerType === RINKEBY ? '#ffffff' : '#9b9b9b',
          },
        }, this.context.t(RINKEBY)),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: GOERLI,
        closeMenu: () => this.props.hideNetworkDropdown(),
        onClick: () => this.handleClick(GOERLI),
        style: dropdownMenuItemStyle,
      },
      [
        providerType === GOERLI ? h('i.fa.fa-check') : h('.network-check__transparent', '✓'),
        h(NetworkDropdownIcon, {
          backgroundColor: '#3099f2', // $dodger-blue
          isSelected: providerType === GOERLI,
        }),
        h('span.network-name-item', {
          style: {
            color: providerType === GOERLI ? '#ffffff' : '#9b9b9b',
          },
        }, this.context.t(GOERLI)),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'default',
        closeMenu: () => this.props.hideNetworkDropdown(),
        onClick: () => this.handleClick(LOCALHOST),
        style: dropdownMenuItemStyle,
      },
      [
        providerType === LOCALHOST ? h('i.fa.fa-check') : h('.network-check__transparent', '✓'),
        h(NetworkDropdownIcon, {
          isSelected: providerType === LOCALHOST,
          innerBorder: '1px solid #9b9b9b',
        }),
        h('span.network-name-item', {
          style: {
            color: providerType === LOCALHOST ? '#ffffff' : '#9b9b9b',
          },
        }, this.context.t(LOCALHOST)),
      ]
    ),

    this.renderCustomOption(props.provider),
    this.renderCommonRpc(rpcListDetail, props.provider),

    h(
      DropdownMenuItem,
      {
        closeMenu: () => this.props.hideNetworkDropdown(),
        onClick: () => {
          setNetworksTabAddMode(true)
          this.props.history.push(NETWORKS_ROUTE)
        },
        style: dropdownMenuItemStyle,
      },
      [
        activeNetwork === 'custom' ? h('i.fa.fa-check') : h('.network-check__transparent', '✓'),
        h(NetworkDropdownIcon, {
          isSelected: activeNetwork === 'custom',
          innerBorder: '1px solid #9b9b9b',
        }),
        h('span.network-name-item', {
          style: {
            color: activeNetwork === 'custom' ? '#ffffff' : '#9b9b9b',
          },
        }, this.context.t('customRPC')),
      ]
    ),

  ])
}

NetworkDropdown.prototype.handleClick = function (newProviderType) {
  const { provider: { type: providerType }, setProviderType } = this.props
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

NetworkDropdown.prototype.getNetworkName = function () {
  const { provider } = this.props
  const providerName = provider.type

  let name

  if (providerName === MAINNET) {
    name = this.context.t(MAINNET)
  } else if (providerName === ROPSTEN) {
    name = this.context.t(ROPSTEN)
  } else if (providerName === KOVAN) {
    name = this.context.t(KOVAN)
  } else if (providerName === RINKEBY) {
    name = this.context.t(RINKEBY)
  } else if (providerName === LOCALHOST) {
    name = this.context.t(LOCALHOST)
  } else if (providerName === GOERLI) {
    name = this.context.t(GOERLI)
  } else {
    name = provider.custom.name || this.context.t('unknownNetwork')
  }

  return name
}

NetworkDropdown.prototype.renderCommonRpc = function (rpcListDetail, provider) {
  const props = this.props
  const reversedRpcListDetail = rpcListDetail.slice().reverse()

  return reversedRpcListDetail.map((entry) => {
    const rpc = entry.rpcUrl
    const ticker = entry.ticker || 'ETH'
    const nickname = entry.nickname || ''
    const currentRpcTarget = provider.type === 'rpc' && rpc === provider.rpcTarget

    if ((rpc === 'http://localhost:8545') || currentRpcTarget) {
      return null
    } else {
      const chainId = entry.chainId
      return h(
        DropdownMenuItem,
        {
          key: `common${rpc}`,
          closeMenu: () => this.props.hideNetworkDropdown(),
          onClick: () => props.setRpcTarget(rpc, chainId, ticker, nickname),
          style: {
            fontSize: '16px',
            lineHeight: '20px',
            padding: '12px 0',
          },
        },
        [
          currentRpcTarget ? h('i.fa.fa-check') : h('.network-check__transparent', '✓'),
          h('i.fa.fa-question-circle.fa-med.menu-icon-circle'),
          h('span.network-name-item', {
            style: {
              color: currentRpcTarget ? '#ffffff' : '#9b9b9b',
            },
          }, nickname || rpc),
          h('i.fa.fa-times.delete',
            {
              onClick: (e) => {
                e.stopPropagation()
                props.delRpcTarget(rpc)
              },
            }),
        ]
      )
    }
  })
}

NetworkDropdown.prototype.renderCustomOption = function (provider) {
  const { rpcTarget, type, ticker, nickname } = provider
  const props = this.props
  const network = props.network

  if (type !== 'rpc') return null

  switch (rpcTarget) {

    case 'http://localhost:8545':
      return null

    default:
      return h(
        DropdownMenuItem,
        {
          key: rpcTarget,
          onClick: () => props.setRpcTarget(rpcTarget, network, ticker, nickname),
          closeMenu: () => this.props.hideNetworkDropdown(),
          style: {
            fontSize: '16px',
            lineHeight: '20px',
            padding: '12px 0',
          },
        },
        [
          h('i.fa.fa-check'),
          h('i.fa.fa-question-circle.fa-med.menu-icon-circle'),
          h('span.network-name-item', {
            style: {
              color: '#ffffff',
            },
          }, nickname || rpcTarget),
        ]
      )
  }
}
