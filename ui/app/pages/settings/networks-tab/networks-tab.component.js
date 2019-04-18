import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { SETTINGS_ROUTE } from '../../../helpers/constants/routes'
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
    history: PropTypes.object,
    location: PropTypes.object,
    networkIsSelected: PropTypes.bool,
    networksTabIsInAddMode: PropTypes.bool,
    networksToRender: PropTypes.array,
    selectedNetwork: PropTypes.object,
    setNetworksTabAddMode: PropTypes.func,
    setRpcTarget: PropTypes.func,
    setSelectedSettingsRpcUrl: PropTypes.func,
    subHeaderKey: PropTypes.string,
  }

  isCurrentPath (pathname) {
    return this.props.location.pathname === pathname
  }

  renderSubHeader () {
    const {
      networkIsSelected,
      setSelectedSettingsRpcUrl,
      subHeaderKey,
      setNetworksTabAddMode,
      networksTabIsInAddMode,
    } = this.props

    return (
      <div className="settings-page__sub-header">
        {
          !this.isCurrentPath(SETTINGS_ROUTE) && (
            <div
              className="settings-page__back-button"
              onClick={networkIsSelected || networksTabIsInAddMode
                ? () => {
                    setNetworksTabAddMode(false)
                    setSelectedSettingsRpcUrl(null)
                  }
                : () => this.props.history.push(SETTINGS_ROUTE)
              }
            />
          )
        }
        <span className="settings-page__sub-header-text">{ this.context.t(subHeaderKey) }</span>
        <div className="networks-tab__add-network-header-button-wrapper">
          <Button
            type="primary"
            onClick={event => {
              event.preventDefault()
              setSelectedSettingsRpcUrl(null)
              setNetworksTabAddMode(true)
            }}
          >
            { this.context.t('addNetwork') }
          </Button>
        </div>
      </div>
    )
  }

  renderNetworkListItem (network, selectRpcUrl) {
    const { setSelectedSettingsRpcUrl, setNetworksTabAddMode } = this.props
    const {
      border,
      iconColor,
      label,
      labelKey,
      rpcUrl,
    } = network

    return (
      <div
        key={'settings-network-list-item:' + rpcUrl}
        className="networks-tab__networks-list-item"
        onClick={ () => {
          setNetworksTabAddMode(false)
          setSelectedSettingsRpcUrl(rpcUrl)
        }}
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
        <div className="networks-tab__networks-list-arrow" />
      </div>
    )
  }

  renderNetworksList () {
    const { networksToRender, selectedNetwork, networkIsSelected, networksTabIsInAddMode } = this.props

    return (
      <div className={classnames('networks-tab__networks-list', {
        'networks-tab__networks-list--selection': networkIsSelected || networksTabIsInAddMode,
      })}>
        { networksToRender.map(network => this.renderNetworkListItem(network, selectedNetwork.rpcUrl)) }
      </div>
    )
  }

  renderNetworksTabContent () {
    const {
      setRpcTarget,
      setSelectedSettingsRpcUrl,
      setNetworksTabAddMode,
      selectedNetwork: {
        labelKey,
        label,
        rpcUrl,
        chainId,
        ticker,
        viewOnly,
      },
      networksTabIsInAddMode,
      networkIsSelected,
    } = this.props

    return (
      <div className="networks-tab__content">
        {this.renderNetworksList()}
        {networksTabIsInAddMode || networkIsSelected
          ? <NetworkForm
            setRpcTarget={setRpcTarget}
            networkName={label || labelKey && this.context.t(labelKey) || ''}
            rpcUrl={rpcUrl}
            chainId={chainId}
            ticker={ticker}
            onClear={() => {
              setNetworksTabAddMode(false)
              setSelectedSettingsRpcUrl(null)
            }}
            viewOnly={viewOnly}
            networksTabIsInAddMode={networksTabIsInAddMode}
          />
          : null
        }
      </div>
    )
  }

  renderContent () {
    const { setNetworksTabAddMode, setSelectedSettingsRpcUrl, networkIsSelected, networksTabIsInAddMode } = this.props

    return (
      <div className="settings-page__body">
        {this.renderSubHeader()}
        {this.renderNetworksTabContent()}
        {!networkIsSelected && !networksTabIsInAddMode
          ? <div className="networks-tab__add-network-button-wrapper">
            <Button
              type="primary"
              onClick={event => {
                event.preventDefault()
                setSelectedSettingsRpcUrl(null)
                setNetworksTabAddMode(true)
              }}
            >
              { this.context.t('addNetwork') }
            </Button>
          </div>
          : null
        }
      </div>
    )
  }

  render () {
    return this.renderContent()
  }
}
