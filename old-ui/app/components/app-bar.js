const PropTypes = require('prop-types')
const {Component} = require('react')
const h = require('react-hyperscript')
const actions = require('../../../ui/app/actions')
const SandwichExpando = require('sandwich-expando')
const {Dropdown} = require('./dropdown')
const {DropdownMenuItem} = require('./dropdown')
const NetworkIndicator = require('./network')
const {AccountDropdowns} = require('./account-dropdowns')
const ethNetProps = require('eth-net-props')

const LOCALHOST_RPC_URL = 'http://localhost:8545'

module.exports = class AppBar extends Component {
  static defaultProps = {
    selectedAddress: undefined,
  }

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    frequentRpcList: PropTypes.array.isRequired,
    isMascara: PropTypes.bool.isRequired,
    isOnboarding: PropTypes.bool.isRequired,
    identities: PropTypes.any.isRequired,
    selectedAddress: PropTypes.string,
    isUnlocked: PropTypes.bool.isRequired,
    network: PropTypes.any.isRequired,
    keyrings: PropTypes.any.isRequired,
    provider: PropTypes.any.isRequired,
  }

  static renderSpace () {
    return (
      h('span', {
        dangerouslySetInnerHTML: {
          __html: '&nbsp;',
        },
      })
    )
  }

  state = {
    isNetworkMenuOpen: false,
  }

  changeState (isMainMenuOpen) {
    this.setState({
      isMainMenuOpen,
      sandwichClass: isMainMenuOpen ? 'sandwich-expando expanded' : 'sandwich-expando',
    })
  }

  renderAppBar () {
    if (window.METAMASK_UI_TYPE === 'notification') {
      return null
    }

    const props = this.props
    const state = this.state || {}
    const isNetworkMenuOpen = state.isNetworkMenuOpen || false
    const {isMascara, isOnboarding} = props

    // Do not render header if user is in mascara onboarding
    if (isMascara && isOnboarding) {
      return null
    }

    // Do not render header if user is in mascara buy ether
    if (isMascara && props.currentView.name === 'buyEth') {
      return null
    }

    return (

      h('.full-width', {
        height: '38px',
      }, [

        h('.app-header.flex-row.flex-space-between', {
          style: {
            alignItems: 'center',
            visibility: props.isUnlocked ? 'visible' : 'none',
            background: 'white',
            height: '38px',
            position: 'relative',
            zIndex: 12,
          },
        }, [

          h('div.left-menu-section', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            },
          }, [

            // mini logo
            h('img', {
              height: 24,
              width: 24,
              src: './images/icon-128.png',
            }),

            h(NetworkIndicator, {
              network: this.props.network,
              provider: this.props.provider,
              isUnlocked: this.props.isUnlocked,
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                this.setState({ isNetworkMenuOpen: !isNetworkMenuOpen })
              },
            }),

          ]),

          props.isUnlocked && h('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            },
          }, [
            h(AccountDropdowns, {
              style: {},
              enableAccountsSelector: true,
              identities: this.props.identities,
              selected: this.props.selectedAddress,
              network: this.props.network,
              keyrings: this.props.keyrings,
            }, []),

            // hamburger
            h('div', {
              className: state.sandwichClass || 'sandwich-expando',
              style: {
                width: 16,
                height: 16,
                padding: 0,
              },
              onClick: () => this.changeState(!state.isMainMenuOpen),
            }),
          ]),
        ]),
      ])
    )
  }

  renderAppBarAppHeader () {
    const {
      identities,
      selectedAddress,
      isUnlocked,
      network,
      keyrings,
      provider,
    } = this.props
    const {
      isNetworkMenuOpen,
      isMainMenuOpen,
    } = this.state

    return (
      h('.full-width', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          height: '38px',
        },
      }, [
        h('.app-header.flex-row.flex-space-between', {
          style: {
            alignItems: 'center',
            visibility: isUnlocked ? 'visible' : 'none',
            background: isUnlocked ? 'white' : 'none',
            height: '38px',
            position: 'relative',
            zIndex: 12,
          },
        }, [
          h('div.left-menu-section', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            },
          }, [
            // mini logo
            h('img', {
              height: 24,
              width: 24,
              src: './images/icon-128.png',
            }),
            h(NetworkIndicator, {
              network: network,
              provider: provider,
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                this.setState({ isNetworkMenuOpen: !isNetworkMenuOpen })
              },
            }),
          ]),
          isUnlocked && h('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            },
          }, [
            h(AccountDropdowns, {
              style: {},
              enableAccountsSelector: true,
              identities: identities,
              selected: selectedAddress,
              network,
              keyrings,
            }, []),
            h(SandwichExpando, {
              className: 'sandwich-expando',
              width: 16,
              barHeight: 2,
              padding: 0,
              isOpen: isMainMenuOpen,
              color: 'rgb(247,146,30)',
              onClick: () => {
                this.setState({
                  isMainMenuOpen: !isMainMenuOpen,
                })
              },
            }),
          ]),
        ]),
      ])
    )
  }

  renderNetworkDropdown () {
    const props = this.props
    const { provider: { type: providerType } } = props
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
        left: '2px',
        top: '38px',
        width: '270px',
        maxHeight: isOpen ? '524px' : '0px',
      },
      innerStyle: {
        padding: '2px 16px 2px 0px',
      },
    }, [

      h(
        DropdownMenuItem,
        {
          key: 'poa',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => props.dispatch(actions.setProviderType('poa')),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === 'poa' ? 'white' : '',
          },
        },
        [h(providerType === 'poa' ? 'div.selected-network' : ''),
          ethNetProps.props.getNetworkDisplayName(99),
        ]
      ),

      h(
        DropdownMenuItem,
        {
          key: 'dai',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => props.dispatch(actions.setProviderType('dai')),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === 'dai' ? 'white' : '',
          },
        },
        [h(providerType === 'dai' ? 'div.selected-network' : ''),
          ethNetProps.props.getNetworkDisplayName(100),
        ]
      ),

      h(
        DropdownMenuItem,
        {
          key: 'sokol',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => props.dispatch(actions.setProviderType('sokol')),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === 'sokol' ? 'white' : '',
          },
        },
        [h(providerType === 'sokol' ? 'div.selected-network' : ''),
          ethNetProps.props.getNetworkDisplayName(77),
        ]
      ),

      h(
        DropdownMenuItem,
        {
          key: 'main',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => props.dispatch(actions.setProviderType('mainnet')),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === 'mainnet' ? 'white' : '',
          },
        },
        [h(providerType === 'mainnet' ? 'div.selected-network' : ''),
          ethNetProps.props.getNetworkDisplayName(1),
        ]
      ),

      h(
        DropdownMenuItem,
        {
          key: 'ropsten',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => props.dispatch(actions.setProviderType('ropsten')),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === 'ropsten' ? 'white' : '',
          },
        },
        [h(providerType === 'ropsten' ? 'div.selected-network' : ''),
          ethNetProps.props.getNetworkDisplayName(3),
        ]
      ),

      h(
        DropdownMenuItem,
        {
          key: 'kovan',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => props.dispatch(actions.setProviderType('kovan')),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === 'kovan' ? 'white' : '',
          },
        },
        [h(providerType === 'kovan' ? 'div.selected-network' : ''),
          ethNetProps.props.getNetworkDisplayName(42),
        ]
      ),

      h(
        DropdownMenuItem,
        {
          key: 'rinkeby',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => props.dispatch(actions.setProviderType('rinkeby')),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === 'rinkeby' ? 'white' : '',
          },
        },
        [h(providerType === 'rinkeby' ? 'div.selected-network' : ''),
          ethNetProps.props.getNetworkDisplayName(4),
        ]
      ),

      h(
        DropdownMenuItem,
        {
          key: 'default',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => {
            props.dispatch(actions.setRpcTarget('http://localhost:8545'))
            props.dispatch(actions.setProviderType('localhost'))
          },
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === 'localhost' ? 'white' : '',
          },
        },
        [h(providerType === 'localhost' ? 'div.selected-network' : ''),
          'Localhost 8545',
        ]
      ),

      h(
        DropdownMenuItem,
        {
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => this.props.dispatch(actions.showConfigPage()),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: '#60db97',
          },
        },
        [
          'Custom RPC',
        ]
      ),

      this.renderSelectedCustomOption(props.provider),
      this.renderCommonRpc(rpcList, props.provider),

    ])
  }

  renderCustomOption ({ rpcTarget, type }) {
    const {dispatch} = this.props

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
        return h(DropdownMenuItem, {
          key: rpcTarget,
          onClick: () => dispatch(actions.setRpcTarget(rpcTarget)),
          closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
        }, [
          h('i.fa.fa-question-circle.fa-lg.menu-icon'),
          label,
          h('.check', '✓'),
        ])
    }
  }

  renderCommonRpc (rpcList, provider) {
    const props = this.props
    const { rpcTarget, type } = provider

    return rpcList.map((rpc) => {
      if (type === 'rpc' && rpc === rpcTarget) {
        return null
      } else {
        return h(
          DropdownMenuItem,
          {
            key: `common${rpc}`,
            closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
            onClick: () => props.dispatch(actions.setRpcTarget(rpc)),
            style: {
              paddingLeft: '20px',
              fontSize: '16px',
            },
          },
          [
            h('.span.custom-rpc', rpc),
            h('.remove', {
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                this.setState({ isNetworkMenuOpen: false })
                props.dispatch(actions.showDeleteRPC(rpc))
              },
            }),
          ]
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
        return h(
          DropdownMenuItem,
          {
            key: rpcTarget,
            onClick: () => props.dispatch(actions.setRpcTarget(rpcTarget)),
            closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
            style: {
              paddingLeft: '20px',
              fontSize: '16px',
              color: 'white',
            },
          },
          [h('div.selected-network'),
            h('.span.custom-rpc', label),
            h('.remove', {
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                this.setState({ isNetworkMenuOpen: false })
                props.dispatch(actions.showDeleteRPC(label))
              },
            }),
          ]
        )
    }
  }

  renderDropdown () {
    const state = this.state || {}
    const isOpen = state.isMainMenuOpen
    const isMainMenuOpen = !isOpen

    return h(Dropdown, {
      useCssTransition: true,
      isOpen: isOpen,
      zIndex: 11,
      constOverflow: true,
      onClickOutside: (event) => {
        const classList = event.target.classList
        const parentClassList = event.target.parentElement.classList

        const isToggleElement = classList.contains('sandwich-expando') ||
          parentClassList.contains('sandwich-expando')

        if (isOpen && !isToggleElement) {
          this.setState({
            isMainMenuOpen: false,
            sandwichClass: 'sandwich-expando',
          })
        }
      },
      style: {
        position: 'absolute',
        right: '2px',
        top: '38px',
        width: '126px',
        maxHeight: isOpen ? '186px' : '0px',
        overflow: 'hidden',
      },
      innerStyle: {},
    }, [
      h(DropdownMenuItem, {
        closeMenu: () => this.changeState(isMainMenuOpen),
        onClick: () => { this.props.dispatch(actions.showConfigPage()) },
      }, 'Settings'),

      h(DropdownMenuItem, {
        closeMenu: () => this.changeState(isMainMenuOpen),
        onClick: () => { this.props.dispatch(actions.lockMetamask()) },
      }, 'Log Out'),

      h(DropdownMenuItem, {
        closeMenu: () => this.changeState(isMainMenuOpen),
        onClick: () => { this.props.dispatch(actions.showInfoPage()) },
      }, 'Info/Help'),
    ])
  }

  render () {
    return h('div.full-width', [
      this.renderAppBar(),
      this.renderNetworkDropdown(),
      this.renderDropdown(),
    ])
  }
}
