import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { REVEAL_SEED_ROUTE } from '../../../helpers/constants/routes'
import classnames from 'classnames'
import Button from '../../../components/ui/button'
import NetworkDropdownIcon from '../../../components/app/dropdowns/components/network-dropdown-icon'
import TextField from '../../../components/ui/text-field'

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

  renderNetworkListItem (network, selectRpcUrl) {
    const { setSelectedSettingsRpcUrl } = this.props
    const {
      border,
      iconColor,
      label,
      labelKey,
      providerType,
      rpcUrl,
    } = network

    return (
      <div
        className="networks-tab__networks-list-item"
        onClick={ () => setSelectedSettingsRpcUrl(rpcUrl) }
       >
        <NetworkDropdownIcon
          backgroundColor={iconColor || 'white'}
          innerBorder={border}
        />
        <div className={ classnames('networks-tab__networks-list-name', {
          'networks-tab__networks-list-name--selected': selectRpcUrl === rpcUrl,
        }) }>
          { label || this.context.t(labelKey) }
        </div>
      </div>
    )
  }

  renderNetworksList () {
    const { networksToRender, selectedNetwork } = this.props

    return (
      <div className="networks-tab__networks-list">
        { networksToRender.map(network => this.renderNetworkListItem(network, selectedNetwork.rpcUrl)) }
      </div>
    )
  }

  renderNetworkForm () {
    const {
      selectedNetwork: {
        labelKey,
        label,
        rpcUrl,
        chainId,
        ticker,
      },
    } = this.props


    return (
      <div className="networks-tab__network-form">
        <div className="networks-tab__network-form-label">Network Name</div>
        <TextField
          type="text"
          id="network-name"
          placeholder={this.context.t('networkName')}
          onChange={e => console.log(e.target.value)}
          fullWidth
          margin="dense"
          value={label || this.context.t(labelKey)}
        />
        <div className="networks-tab__network-form-label">RPC Url</div>
        <TextField
          type="text"
          id="rpc-url"
          placeholder={this.context.t('rpcUrl')}
          onChange={e => console.log(e.target.value)}
          fullWidth
          margin="dense"
          value={rpcUrl}
        />
        <div className="networks-tab__network-form-label">Chain Id</div>
        <TextField
          type="text"
          id="chainId"
          placeholder={this.context.t('chainId')}
          onChange={e => console.log(e.target.value)}
          fullWidth
          margin="dense"
          value={chainId}
        />
        <div className="networks-tab__network-form-label">Symbol</div>
        <TextField
          type="text"
          id="network-ticker"
          placeholder={this.context.t('symbol')}
          onChange={e => console.log(e.target.value)}
          fullWidth
          margin="dense"
          value={ticker}
        />
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
