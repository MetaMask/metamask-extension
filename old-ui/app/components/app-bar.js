const PropTypes = require('prop-types')
const {Component} = require('react')
const h = require('react-hyperscript')
const actions = require('../../../ui/app/actions')
const SandwichExpando = require('sandwich-expando')
const {Dropdown} = require('./dropdown')
const {DropdownMenuItem} = require('./dropdown')
const NetworkIndicator = require('./network')
const {AccountDropdowns} = require('./account-dropdowns')

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

  renderAppBar () {
    if (window.METAMASK_UI_TYPE === 'notification') {
      return null
    }

    const props = this.props
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
      h('div.app-bar', [
        this.renderAppBarNewUiNotice(),
        this.renderAppBarAppHeader(),
      ])
    )
  }

  renderAppBarNewUiNotice () {
    const {dispatch} = this.props

    return (
      h('div.app-bar__new-ui-banner', {
        style: {
          height: '28px',
          zIndex: 12,
        },
      }, [
        'Try the New MetaMask',
        AppBar.renderSpace(),
        h('span.banner__link', {
          async onClick () {
            await dispatch(actions.setFeatureFlag('betaUI', true))
            global.platform.openExtensionInBrowser()
          },
        }, [
          'Now',
        ]),
        AppBar.renderSpace(),
        'or',
        AppBar.renderSpace(),
        h('span.banner__link', {
          onClick () {
            global.platform.openWindow({
              url: 'https://medium.com/metamask/74dba32cc7f7',
            })
          },
        }, [
          'Learn More',
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
    const {
      dispatch,
      frequentRpcList: rpcList,
      provider,
    } = this.props
    const {
      type: providerType,
      rpcTarget: activeNetwork,
    } = provider
    const isOpen = this.state.isNetworkMenuOpen

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
        top: '64px',
      },
      innerStyle: {
        padding: '2px 16px 2px 0px',
      },
    }, [
      h(DropdownMenuItem, {
        key: 'main',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => dispatch(actions.setProviderType('mainnet')),
        style: {
          fontSize: '18px',
        },
      }, [
        h('.menu-icon.diamond'),
        'Main Ethereum Network',
        providerType === 'mainnet'
          ? h('.check', '✓')
          : null,
      ]),
      h(DropdownMenuItem, {
        key: 'ropsten',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => dispatch(actions.setProviderType('ropsten')),
        style: {
          fontSize: '18px',
        },
      }, [
        h('.menu-icon.red-dot'),
        'Ropsten Test Network',
        providerType === 'ropsten'
          ? h('.check', '✓')
          : null,
      ]),
      h(DropdownMenuItem, {
        key: 'kovan',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => dispatch(actions.setProviderType('kovan')),
        style: {
          fontSize: '18px',
        },
      }, [
        h('.menu-icon.hollow-diamond'),
        'Kovan Test Network',
        providerType === 'kovan'
          ? h('.check', '✓')
          : null,
      ]),
      h(DropdownMenuItem, {
        key: 'rinkeby',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => dispatch(actions.setProviderType('rinkeby')),
        style: {
          fontSize: '18px',
        },
      }, [
        h('.menu-icon.golden-square'),
        'Rinkeby Test Network',
        providerType === 'rinkeby'
          ? h('.check', '✓')
          : null,
      ]),
      h(DropdownMenuItem, {
        key: 'default',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => dispatch(actions.setProviderType('localhost')),
        style: {
          fontSize: '18px',
        },
      }, [
        h('i.fa.fa-question-circle.fa-lg.menu-icon'),
        'Localhost 8545',
        activeNetwork === LOCALHOST_RPC_URL
          ? h('.check', '✓')
          : null,
      ]),

      this.renderCustomOption(provider),
      this.renderCommonRpc(rpcList, provider),

      h(DropdownMenuItem, {
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => dispatch(actions.showConfigPage()),
        style: {
          fontSize: '18px',
        },
      }, [
        h('i.fa.fa-question-circle.fa-lg.menu-icon'),
        'Custom RPC',
        activeNetwork === 'custom'
          ? h('.check', '✓')
          : null,
      ]),
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

  renderCommonRpc (rpcList, {rpcTarget}) {
    const {dispatch} = this.props

    return rpcList.map((rpc) => {
      if ((rpc === LOCALHOST_RPC_URL) || (rpc === rpcTarget)) {
        return null
      } else {
        return h(DropdownMenuItem, {
          key: `common${rpc}`,
          closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
          onClick: () => dispatch(actions.setRpcTarget(rpc)),
        }, [
          h('i.fa.fa-question-circle.fa-lg.menu-icon'),
          rpc,
          rpcTarget === rpc
            ? h('.check', '✓')
            : null,
        ])
      }
    })
  }

  renderDropdown () {
    const {dispatch} = this.props
    const isOpen = this.state.isMainMenuOpen

    return h(Dropdown, {
      useCssTransition: true,
      isOpen: isOpen,
      zIndex: 11,
      onClickOutside: (event) => {
        const classList = event.target.classList
        const parentClassList = event.target.parentElement.classList

        const isToggleElement = classList.contains('sandwich-expando') ||
          parentClassList.contains('sandwich-expando')

        if (isOpen && !isToggleElement) {
          this.setState({ isMainMenuOpen: false })
        }
      },
      style: {
        position: 'absolute',
        right: '2px',
        top: '66px',
      },
      innerStyle: {},
    }, [
      h(DropdownMenuItem, {
        closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
        onClick: () => { dispatch(actions.showConfigPage()) },
      }, 'Settings'),

      h(DropdownMenuItem, {
        closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
        onClick: () => { dispatch(actions.lockMetamask()) },
      }, 'Log Out'),

      h(DropdownMenuItem, {
        closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
        onClick: () => { dispatch(actions.showInfoPage()) },
      }, 'Info/Help'),

      h(DropdownMenuItem, {
        closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
        onClick: () => {
          dispatch(actions.setFeatureFlag('betaUI', true, 'BETA_UI_NOTIFICATION_MODAL'))
        },
      }, 'Try Beta!'),
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
