const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')

// connect, dispatch actions...
        // onClick: () => props.dispatch(actions.setProviderType('mainnet')),
        // onClick: () => props.dispatch(actions.setDefaultRpcTarget()),
        // onClick: () => props.dispatch(actions.setRpcTarget(rpcTarget)),
        // onClick: () => this.props.dispatch(actions.showConfigPage()),

function mapStateToProps (state) {
  return {
    active: state.appState.modalOpen
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
  }
}


inherits(NetworkDropdown, Component)
function NetworkDropdown () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(NetworkDropdown)

// renderNetworkDropdown
// renderCustomOption
// renderCommonRpc
// TODO: specify default props and proptypes
NetworkDropdown.prototype.render = function () {
  const props = this.props
  const { provider: { type: providerType, rpcTarget: activeNetwork } } = props
  const rpcList = props.frequentRpcList
  const state = this.state || {}
  const isOpen = state.isNetworkMenuOpen

  return h(Dropdown, {
    useCssTransition: true,
    isOpen,
    onClickOutside: (event) => {
      const { classList } = event.target
      const isNotToggleElement = [
        classList.contains('menu-icon'),
        classList.contains('network-name'),
        classList.contains('network-indicator'),
      ].filter(bool => bool).length === 0
      // classes from three constituent nodes of the toggle element

      if (isNotToggleElement) {
        this.setState({ isNetworkMenuOpen: false })
      }
    },
    zIndex: 11,
    style: {
      position: 'absolute',
      right: '2px',
      top: '38px',
    },
    innerStyle: {
      padding: '2px 16px 2px 0px',
    },
  }, [

    h(
      DropdownMenuItem,
      {
        key: 'main',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('mainnet')),
        style: {
          fontSize: '18px',
        },
      },
      [
        h('.menu-icon.diamond'),
        'Main Ethereum Network',
        providerType === 'mainnet' ? h('.check', '✓') : null,
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'ropsten',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('ropsten')),
        style: {
          fontSize: '18px',
        },
      },
      [
        h('.menu-icon.red-dot'),
        'Ropsten Test Network',
        providerType === 'ropsten' ? h('.check', '✓') : null,
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'kovan',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('kovan')),
        style: {
          fontSize: '18px',
        },
      },
      [
        h('.menu-icon.hollow-diamond'),
        'Kovan Test Network',
        providerType === 'kovan' ? h('.check', '✓') : null,
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'rinkeby',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('rinkeby')),
        style: {
          fontSize: '18px',
        },
      },
      [
        h('.menu-icon.golden-square'),
        'Rinkeby Test Network',
        providerType === 'rinkeby' ? h('.check', '✓') : null,
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'default',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setDefaultRpcTarget()),
        style: {
          fontSize: '18px',
        },
      },
      [
        h('i.fa.fa-question-circle.fa-lg.menu-icon'),
        'Localhost 8545',
        activeNetwork === 'http://localhost:8545' ? h('.check', '✓') : null,
      ]
    ),

    this.renderCustomOption(props.provider),
    this.renderCommonRpc(rpcList, props.provider),

    h(
      DropdownMenuItem,
      {
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => this.props.dispatch(actions.showConfigPage()),
        style: {
          fontSize: '18px',
        },
      },
      [
        h('i.fa.fa-question-circle.fa-lg.menu-icon'),
        'Custom RPC',
        activeNetwork === 'custom' ? h('.check', '✓') : null,
      ]
    ),

  ])
}


NetworkDropdown.prototype.getNetworkName = function () {
  const { provider } = this.props
  const providerName = provider.type

  let name

  if (providerName === 'mainnet') {
    name = 'Main Ethereum Network'
  } else if (providerName === 'ropsten') {
    name = 'Ropsten Test Network'
  } else if (providerName === 'kovan') {
    name = 'Kovan Test Network'
  } else if (providerName === 'rinkeby') {
    name = 'Rinkeby Test Network'
  } else {
    name = 'Unknown Private Network'
  }

  return name
}

NetworkDropdown.prototype.renderCommonRpc = function (rpcList, provider) {
  const props = this.props
  const rpcTarget = provider.rpcTarget

  return rpcList.map((rpc) => {
    if ((rpc === 'http://localhost:8545') || (rpc === rpcTarget)) {
      return null
    } else {
      return h(
        DropdownMenuItem,
        {
          key: `common${rpc}`,
          closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
          onClick: () => props.dispatch(actions.setRpcTarget(rpc)),
        },
        [
          h('i.fa.fa-question-circle.fa-lg.menu-icon'),
          rpc,
          rpcTarget === rpc ? h('.check', '✓') : null,
        ]
      )
    }
  })
}

NetworkDropdown.prototype.renderCustomOption = function (provider) {
  const { rpcTarget, type } = provider
  const props = this.props

  if (type !== 'rpc') return null

  // Concatenate long URLs
  let label = rpcTarget
  if (rpcTarget.length > 31) {
    label = label.substr(0, 34) + '...'
  }

  switch (rpcTarget) {

    case 'http://localhost:8545':
      return null

    default:
      return h(
        DropdownMenuItem,
        {
          key: rpcTarget,
          onClick: () => props.dispatch(actions.setRpcTarget(rpcTarget)),
          closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
        },
        [
          h('i.fa.fa-question-circle.fa-lg.menu-icon'),
          label,
          h('.check', '✓'),
        ]
      )
  }
}
