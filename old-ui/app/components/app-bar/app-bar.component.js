import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SandwichExpando from 'sandwich-expando'
import NetworkIndicator from '../network'
import { AccountDropdowns } from '../account-dropdowns/account-dropdowns.component'
import classnames from 'classnames'

import NetworksMenu from './networks-menu'
import MainMenu from './main-menu'

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
      <span
        dangerouslySetInnerHTML={{
          __html: '&nbsp;',
        }}
      />
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

      <div
        className="full-width"
        height="38px"
      >
        <div className="app-header flex-row flex-space-between"
          style={{
            alignItems: 'center',
            visibility: isUnlocked ? 'visible' : 'none',
            background: 'white',
            height: '38px',
            position: 'relative',
            zIndex: 12,
          }}
        >
          <div className="app-bar-left-menu-section">
            <img
              height={24}
              width={24}
              src={'./images/icon-128.png'}
            />
            <NetworkIndicator
              network={network}
              provider={provider}
              isUnlocked={isUnlocked}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                this.setState({ isNetworkMenuOpen: !isNetworkMenuOpen })
              }}
            />
          </div>
          {isUnlocked && (
            <div className="app-bar-right-menus-section">
              <AccountDropdowns
                enableAccountsSelector={true}
                identities={identities}
                selected={selectedAddress}
                network={network}
                keyrings={keyrings}
              />
              <div
                className={classnames('app-bar-burger', state.sandwichClass || 'sandwich-expando')}
                onClick={() => this.changeState(!state.isMainMenuOpen)}
              />
            </div>
          )}
        </div>
      </div>
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
      <div className="full-width app-bar-header-container">
        <div
          className="app-header flex-row flex-space-between"
          style={{
            alignItems: 'center',
            visibility: isUnlocked ? 'visible' : 'none',
            background: isUnlocked ? 'white' : 'none',
            height: '38px',
            position: 'relative',
            zIndex: 12,
          }}
        >
          <div className="app-bar-left-menu-section">
            <img
              height={24}
              width={24}
              src={'./images/icon-128.png'}
            />
            <NetworkIndicator
              network={network}
              provider={provider}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                this.setState({ isNetworkMenuOpen: !isNetworkMenuOpen })
              }}
            />
          </div>
          {isUnlocked && (
            <div className="app-bar-right-menus-section">
              <AccountDropdowns
                enableAccountsSelector={true}
                identities={identities}
                selected={selectedAddress}
                network={network}
                keyrings={keyrings}
              />
            </div>
          )}
          <SandwichExpando
            className={'sandwich-expando'}
            width={16}
            barHeight={2}
            padding={0}
            isOpen={isMainMenuOpen}
            color={'rgb(247,146,30)'}
            onClick={() => {
              this.setState({
                isMainMenuOpen: !isMainMenuOpen,
              })
            }}
          />
        </div>
      </div>
    )
  }

  updateNetworksMenuOpenState (isNetworkMenuOpen) {
    this.setState({ isNetworkMenuOpen })
  }

  openMainMenu () {
    this.setState({
      isMainMenuOpen: false,
      sandwichClass: 'sandwich-expando',
    })
  }

  render () {
    return (
      <div className="full-width">
        {this.renderAppBar()}
        <NetworksMenu
          key="NetworksMenu"
          updateNetworksMenuOpenState={() => this.updateNetworksMenuOpenState()}
          provider={this.props.provider}
          frequentRpcList={this.props.frequentRpcList}
          isNetworkMenuOpen={this.state.isNetworkMenuOpen}
        />
        <MainMenu
          key="MainMenu"
          changeState={() => this.changeState()}
          openMainMenu={() => this.openMainMenu()}
          isMainMenuOpen={this.state.isMainMenuOpen}
        />
      </div>
    )
  }
}
