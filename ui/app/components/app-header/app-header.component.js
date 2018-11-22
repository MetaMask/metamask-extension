import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { matchPath } from 'react-router-dom'
import Identicon from '../identicon'

const {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} = require('../../../../app/scripts/lib/enums')
const { DEFAULT_ROUTE, INITIALIZE_ROUTE, CONFIRM_TRANSACTION_ROUTE } = require('../../routes')
const NetworkIndicator = require('../network')

export default class AppHeader extends PureComponent {
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

  isConfirming () {
    const { location } = this.props

    return Boolean(matchPath(location.pathname, {
      path: CONFIRM_TRANSACTION_ROUTE, exact: false,
    }))
  }

  renderAccountMenu () {
    const { isUnlocked, toggleAccountMenu, selectedAddress } = this.props

    return isUnlocked && (
      <div
        className={classnames('account-menu__icon', {
          'account-menu__icon--disabled': this.isConfirming(),
        })}
        onClick={() => this.isConfirming() || toggleAccountMenu()}
      >
        <Identicon
          address={selectedAddress}
          diameter={32}
        />
      </div>
    )
  }

  hideAppHeader () {
    const { location } = this.props

    const isInitializing = Boolean(matchPath(location.pathname, {
      path: INITIALIZE_ROUTE, exact: false,
    }))

    if (isInitializing) {
      return true
    }

    if (window.METAMASK_UI_TYPE === ENVIRONMENT_TYPE_NOTIFICATION) {
      return true
    }

    if (window.METAMASK_UI_TYPE === ENVIRONMENT_TYPE_POPUP && this.isConfirming()) {
      return true
    }
  }

  render () {
    const {
      network,
      provider,
      history,
      isUnlocked,
    } = this.props

    if (this.hideAppHeader()) {
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
              className="app-header__metafox-logo app-header__metafox-logo--horizontal"
              src="/images/logo/metamask-logo-horizontal.svg"
              height={30}
            />
            <img
              className="app-header__metafox-logo app-header__metafox-logo--icon"
              src="/images/logo/metamask-fox.svg"
              height={42}
              width={42}
            />
          </div>
          <div className="app-header__account-menu-container">
            <div className="app-header__network-component-wrapper">
              <NetworkIndicator
                network={network}
                provider={provider}
                onClick={event => this.handleNetworkIndicatorClick(event)}
                disabled={this.isConfirming()}
              />
            </div>
            { this.renderAccountMenu() }
          </div>
        </div>
      </div>
    )
  }
}
