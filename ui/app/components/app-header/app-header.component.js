import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const { ENVIRONMENT_TYPE_NOTIFICATION } = require('../../../../app/scripts/lib/enums')
const { DEFAULT_ROUTE, CONFIRM_TRANSACTION_ROUTE } = require('../../routes')
const Identicon = require('../identicon')
const NetworkIndicator = require('../network')

class AppHeader extends Component {
  static propTypes = {
    history: PropTypes.object,
    location: PropTypes.object,
    network: PropTypes.string,
    provider: PropTypes.object,
    networkDropdownOpen: PropTypes.bool,
    showNetworkDropdown: PropTypes.func,
    hideNetworkDropdown: PropTypes.func,
    toggleAccountMenu: PropTypes.func,
    selectedAddress: PropTypes.string,
    isUnlocked: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleNetworkIndicatorClick (event) {
    event.preventDefault()
    event.stopPropagation()

    const { networkDropdownOpen, showNetworkDropdown, hideNetworkDropdown } = this.props

    return networkDropdownOpen === false
      ? showNetworkDropdown()
      : hideNetworkDropdown()
  }

  renderAccountMenu () {
    const { isUnlocked, toggleAccountMenu, selectedAddress } = this.props

    return isUnlocked && (
      <div
        className="account-menu__icon"
        onClick={toggleAccountMenu}
      >
        <Identicon
          address={selectedAddress}
          diameter={32}
        />
      </div>
    )
  }

  render () {
    const {
      network,
      provider,
      history,
      location,
      isUnlocked,
    } = this.props

    if (window.METAMASK_UI_TYPE === ENVIRONMENT_TYPE_NOTIFICATION) {
      return null
    }

    return (
      <div
        className={classnames('app-header', { 'app-header--back-drop': isUnlocked })}>
        <div className="app-header__contents">
          <div
            className="app-header__logo-container"
            onClick={() => history.push(DEFAULT_ROUTE)}
          >
            <img
              className="app-header__metafox"
              src="/images/metamask-fox.svg"
              height={42}
              width={42}
            />
            <div className="flex-row">
              <h1>{ this.context.t('appName') }</h1>
              <div className="app-header__beta-label">
                { this.context.t('beta') }
              </div>
            </div>
          </div>
          <div className="app-header__account-menu-container">
            <div className="network-component-wrapper">
              <NetworkIndicator
                network={network}
                provider={provider}
                onClick={event => this.handleNetworkIndicatorClick(event)}
                disabled={location.pathname === CONFIRM_TRANSACTION_ROUTE}
              />
            </div>
            { this.renderAccountMenu() }
          </div>
        </div>
      </div>
    )
  }
}

export default AppHeader
