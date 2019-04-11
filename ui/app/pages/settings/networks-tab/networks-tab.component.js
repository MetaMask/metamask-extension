import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { REVEAL_SEED_ROUTE } from '../../../helpers/constants/routes'
import Button from '../../../components/ui/button'
import NetworkDropdownIcon from '../../../components/app/dropdowns/components/network-dropdown-icon'

export default class NetworksTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
  }

  renderSubHeader () {
    return (
      <div className="settings-page__sub-header">
        <span className="settings-page__sub-header-text">Networks</span>
      </div>
    )
  }
        // style={{ color: iconColor || 'white', border }}

  renderNetworkListItem (network) {
    const {
      border,
      iconColor,
      label,
      labelKey,
      providerType,
      rpcUrl,
    } = network

    return (
      <div className="networks-tab__networks-list-item">
        <NetworkDropdownIcon
          backgroundColor={iconColor || 'white'}
          innerBorder={border}
        />
        <div className="networks-tab_networks-list-name">
          { label || this.context.t(labelKey) }
        </div>
      </div>
    )
  }

  renderNetworksList () {
    const { networksToRender } = this.props

    return (
      <div className="networks-tab__networks-list">
        { networksToRender.map(network => this.renderNetworkListItem(network)) }
      </div>
    )
  }

  renderNetworkForm () {
    return (
      <div className="networks-tab__network-form">
      </div>
    )
  }

  renderNetworksTabContent () {
    return (
      <div className="networks-tab__content">
        {this.renderNetworksList()}
        {this.renderNetworkForm()}
      </div>
    )
  }

  renderContent () {
    const { warning } = this.props

    return (
      <div className="settings-page__body">
        {this.renderSubHeader()}
        {this.renderNetworksTabContent()}
      </div>
    )
  }

  render () {
    return this.renderContent()
  }
}
