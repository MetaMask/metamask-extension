import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { SETTINGS_ROUTE } from '../../../helpers/constants/routes'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
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
    editRpc: PropTypes.func,
    history: PropTypes.object,
    location: PropTypes.object,
    networkIsSelected: PropTypes.bool,
    networksTabIsInAddMode: PropTypes.bool,
    networksToRender: PropTypes.array,
    selectedNetwork: PropTypes.object,
    setNetworksTabAddMode: PropTypes.func,
    setRpcTarget: PropTypes.func,
    setSelectedSettingsRpcUrl: PropTypes.func,
    providerUrl: PropTypes.string,
    providerType: PropTypes.string,
    networkDefaultedToProvider: PropTypes.bool,
  }

  componentWillMount () {
    this.props.setSelectedSettingsRpcUrl(null)
  }

  isCurrentPath (pathname) {
    return this.props.location.pathname === pathname
  }

  renderSubHeader () {
    const {
      networkIsSelected,
      setSelectedSettingsRpcUrl,
      setNetworksTabAddMode,
      networksTabIsInAddMode,
      networkDefaultedToProvider,
    } = this.props

    return (
      <div className="settings-page__sub-header">
        {
          !this.isCurrentPath(SETTINGS_ROUTE) && (
            <div
              className="settings-page__back-button"
              onClick={(networkIsSelected && !networkDefaultedToProvider) || networksTabIsInAddMode
                ? () => {
                    setNetworksTabAddMode(false)
                    setSelectedSettingsRpcUrl(null)
                  }
                : () => this.props.history.push(SETTINGS_ROUTE)
              }
            />
          )
        }
        <span className="settings-page__sub-header-text">{ this.context.t('networks') }</span>
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
    const {
      setSelectedSettingsRpcUrl,
      setNetworksTabAddMode,
      networkIsSelected,
      providerUrl,
      providerType,
      networksTabIsInAddMode,
    } = this.props
    const {
      border,
      iconColor,
      label,
      labelKey,
      rpcUrl,
      providerType: currentProviderType,
    } = network

    const listItemNetworkIsSelected = selectRpcUrl && selectRpcUrl === rpcUrl
    const listItemUrlIsProviderUrl = rpcUrl === providerUrl
    const listItemTypeIsProviderNonRpcType = providerType !== 'rpc' && currentProviderType === providerType
    const listItemNetworkIsCurrentProvider = !networkIsSelected && !networksTabIsInAddMode && (listItemUrlIsProviderUrl || listItemTypeIsProviderNonRpcType)
    const displayNetworkListItemAsSelected = listItemNetworkIsSelected || listItemNetworkIsCurrentProvider

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
          'networks-tab__networks-list-name--selected': displayNetworkListItemAsSelected,
        }) }>
          { label || this.context.t(labelKey) }
        </div>
        <div className="networks-tab__networks-list-arrow" />
      </div>
    )
  }

  renderNetworksList () {
    const { networksToRender, selectedNetwork, networkIsSelected, networksTabIsInAddMode, networkDefaultedToProvider } = this.props

    return (
      <div className={classnames('networks-tab__networks-list', {
        'networks-tab__networks-list--selection': (networkIsSelected && !networkDefaultedToProvider) || networksTabIsInAddMode,
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
        rpcPrefs,
        blockExplorerUrl,
      },
      networksTabIsInAddMode,
      editRpc,
      networkDefaultedToProvider,
    } = this.props
    const envIsPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP

    return (
      <div className="networks-tab__content">
        {this.renderNetworksList()}
        {networksTabIsInAddMode || !envIsPopup || (envIsPopup && !networkDefaultedToProvider)
          ? <NetworkForm
            setRpcTarget={setRpcTarget}
            editRpc={editRpc}
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
            rpcPrefs={rpcPrefs}
            blockExplorerUrl={blockExplorerUrl}
          />
          : null
        }
      </div>
    )
  }

  renderContent () {
    const { setNetworksTabAddMode, setSelectedSettingsRpcUrl, networkIsSelected, networksTabIsInAddMode } = this.props

    return (
      <div className="networks-tab__body">
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
