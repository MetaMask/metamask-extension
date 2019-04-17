import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { REVEAL_SEED_ROUTE } from '../../../helpers/constants/routes'
import classnames from 'classnames'
import Button from '../../../components/ui/button'
import NetworkForm from './network-form'
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

  validateAndSetRpc (newRpc, chainId, ticker = 'ETH', nickname) {
    const { setRpcTarget, displayWarning } = this.props
    if (validUrl.isWebUri(newRpc)) {
      if (!!chainId && Number.isNaN(parseInt(chainId))) {
        return displayWarning(`${this.context.t('invalidInput')} chainId`)
      }

      setRpcTarget(newRpc, chainId, ticker, nickname)
    } else {
      const appendedRpc = `http://${newRpc}`

      if (validUrl.isWebUri(appendedRpc)) {
        displayWarning(this.context.t('uriErrorMsg'))
      } else {
        displayWarning(this.context.t('invalidRPC'))
      }
    }
  }

  renderNetworksTabContent () {
    const {
      setRpcTarget,
      displayWarning,
      setSelectedSettingsRpcUrl,
      selectedNetwork: {
        labelKey,
        label,
        rpcUrl,
        chainId,
        ticker,
        viewOnly,
      },
    } = this.props

    return (
      <div className="networks-tab__content">
        {this.renderNetworksList()}
        <NetworkForm
          setRpcTarget={setRpcTarget}
          displayWarning={displayWarning}
          networkName={label || labelKey && this.context.t(labelKey) || ''}
          rpcUrl={rpcUrl}
          chainId={chainId}
          ticker={ticker}
          onClear={() => setSelectedSettingsRpcUrl(null)}
          viewOnly={viewOnly}
        />
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
