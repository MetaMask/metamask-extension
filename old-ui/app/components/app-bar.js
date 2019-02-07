import PropTypes from 'prop-types'
import {Component} from 'react'
import h from 'react-hyperscript'
import actions from '../../../ui/app/actions'
import SandwichExpando from 'sandwich-expando'
import { Dropdown, DropdownMenuItem } from './dropdown'
import NetworkIndicator from './network'
import {AccountDropdowns} from './account-dropdowns/index'
import ethNetProps from 'eth-net-props'

import { LOCALHOST } from '../../../app/scripts/controllers/network/enums'
import { networks } from '../../../app/scripts/controllers/network/util'

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
    currentView: PropTypes.object,
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

    const state = this.state || {}
    const isNetworkMenuOpen = state.isNetworkMenuOpen || false
    const {
      isMascara,
      isOnboarding,
      isUnlocked,
      currentView,
      network,
      provider,
      identities,
      selectedAddress,
      keyrings,
    } = this.props

    // Do not render header if user is in mascara onboarding
    if (isMascara && isOnboarding) {
      return null
    }

    // Do not render header if user is in mascara buy ether
    if (isMascara && currentView.name === 'buyEth') {
      return null
    }

    return (

      h('.full-width', {
        height: '38px',
      }, [

        h('.app-header.flex-row.flex-space-between', {
          style: {
            visibility: isUnlocked ? 'visible' : 'none',
            background: 'white',
            height: '38px',
          },
        }, [

          h('div.app-bar-left-menu-section', [

            // mini logo
            h('img', {
              height: 24,
              width: 24,
              src: './images/icon-128.png',
            }),

            h(NetworkIndicator, {
              network,
              provider,
              isUnlocked,
              onClick: (event) => {
                event.preventDefault()
                event.stopPropagation()
                this.setState({ isNetworkMenuOpen: !isNetworkMenuOpen })
              },
            }),

          ]),

          isUnlocked && h('div.app-bar-right-menus-section', [
            h(AccountDropdowns, {
              enableAccountsSelector: true,
              identities,
              selected: selectedAddress,
              network,
              keyrings,
            }, []),

            // hamburger
            h('div.app-bar-burger', {
              className: state.sandwichClass || 'sandwich-expando',
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
      h('.full-width.app-bar-header-container', [
        h('.app-header.flex-row.flex-space-between', {
          style: {
            visibility: isUnlocked ? 'visible' : 'none',
            background: isUnlocked ? 'white' : 'none',
            height: '38px',
          },
        }, [
          h('div.app-bar-left-menu-section', [
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
          isUnlocked && h('div.app-bar-right-menus-section', [
            h(AccountDropdowns, {
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

    const knownNetworks = Object.keys(networks)
    .filter((networkID) => {
      return !isNaN(networkID)
    })

    const sortedNetworks = knownNetworks
    .sort(this._sortNetworks)
    const networksView = this._renderNetworksView(sortedNetworks)

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

      ...networksView,

      h(
        DropdownMenuItem,
        {
          key: 'default',
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => {
            props.dispatch(actions.setRpcTarget('http://localhost:8545'))
            props.dispatch(actions.setProviderType(LOCALHOST))
          },
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: providerType === LOCALHOST ? 'white' : '',
          },
        },
        [h(providerType === LOCALHOST ? 'div.selected-network' : ''),
          'Localhost 8545',
        ]
      ),

      h(
        DropdownMenuItem,
        {
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => this.props.dispatch(actions.showConfigPage()),
          className: 'app-bar-networks-dropdown-custom-rpc',
        },
        [
          'Custom RPC',
        ]
      ),

      this.renderSelectedCustomOption(props.provider),
      this.renderCommonRpc(rpcList, props.provider),

    ])
  }

  _renderNetworksView (_networks) {
    const props = this.props
    const { provider: { type: providerType } } = props
    const state = this.state || {}
    const isOpen = state.isNetworkMenuOpen

    const networkDropdownItems = _networks
    .map((networkID) => {
      const networkObj = networks[networkID]
      return h(
        DropdownMenuItem,
        {
          key: networkObj.providerName,
          closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
          onClick: () => props.dispatch(actions.setProviderType(networkObj.providerName)),
          style: {
            paddingLeft: '20px',
            color: providerType === networkObj.providerName ? 'white' : '',
          },
        },
        [h(providerType === networkObj.providerName ? 'div.selected-network' : ''),
          ethNetProps.props.getNetworkDisplayName(networkID),
        ]
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
