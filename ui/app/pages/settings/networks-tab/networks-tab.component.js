import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Button from '../../../components/ui/button'
import LockIcon from '../../../components/ui/lock-icon'
import {
  NETWORKS_ROUTE,
  NETWORKS_FORM_ROUTE,
} from '../../../helpers/constants/routes'
import NetworkDropdownIcon from '../../../components/app/dropdowns/components/network-dropdown-icon'
import NetworkForm from './network-form'

export default class NetworksTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
    metricsEvent: PropTypes.func.isRequired,
  }

  static propTypes = {
    editRpc: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
    networkIsSelected: PropTypes.bool,
    networksTabIsInAddMode: PropTypes.bool,
    networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedNetwork: PropTypes.object,
    setNetworksTabAddMode: PropTypes.func.isRequired,
    setRpcTarget: PropTypes.func.isRequired,
    setSelectedSettingsRpcUrl: PropTypes.func.isRequired,
    showConfirmDeleteNetworkModal: PropTypes.func.isRequired,
    providerUrl: PropTypes.string,
    providerType: PropTypes.string,
    networkDefaultedToProvider: PropTypes.bool,
    history: PropTypes.object.isRequired,
    shouldRenderNetworkForm: PropTypes.bool.isRequired,
    isFullScreen: PropTypes.bool.isRequired,
  }

  componentWillUnmount () {
    this.props.setSelectedSettingsRpcUrl('')
  }

  isCurrentPath (pathname) {
    return this.props.location.pathname === pathname
  }

  renderSubHeader () {
    const {
      setSelectedSettingsRpcUrl,
      setNetworksTabAddMode,
    } = this.props

    return (
      <div className="settings-page__sub-header">
        <span className="settings-page__sub-header-text">{ this.context.t('networks') }</span>
        <div className="networks-tab__add-network-header-button-wrapper">
          <Button
            type="secondary"
            onClick={(event) => {
              event.preventDefault()
              setSelectedSettingsRpcUrl('')
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
      history,
      isFullScreen,
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
        key={`settings-network-list-item:${rpcUrl}`}
        className="networks-tab__networks-list-item"
        onClick={() => {
          setNetworksTabAddMode(false)
          setSelectedSettingsRpcUrl(rpcUrl)
          !isFullScreen && history.push(NETWORKS_FORM_ROUTE)
        }}
      >
        <NetworkDropdownIcon
          backgroundColor={iconColor || 'white'}
          innerBorder={border}
        />
        <div
          className={classnames('networks-tab__networks-list-name', {
            'networks-tab__networks-list-name--selected': displayNetworkListItemAsSelected,
            'networks-tab__networks-list-name--disabled': currentProviderType !== 'rpc' && !displayNetworkListItemAsSelected,
          })}
        >
          { label || this.context.t(labelKey) }
          { currentProviderType !== 'rpc' && (
            <LockIcon
              width="14px"
              height="17px"
              fill="#cdcdcd"
            />
          ) }
        </div>
        <div className="networks-tab__networks-list-arrow" />
      </div>
    )
  }

  renderNetworksList () {
    const { networksToRender, selectedNetwork, networkIsSelected, networksTabIsInAddMode, networkDefaultedToProvider } = this.props

    return (
      <div
        className={classnames('networks-tab__networks-list', {
          'networks-tab__networks-list--selection': (networkIsSelected && !networkDefaultedToProvider) || networksTabIsInAddMode,
        })}
      >
        { networksToRender.map((network) => this.renderNetworkListItem(network, selectedNetwork.rpcUrl)) }
        {
          networksTabIsInAddMode && (
            <div
              className="networks-tab__networks-list-item"
            >
              <NetworkDropdownIcon
                backgroundColor="white"
                innerBorder="1px solid rgb(106, 115, 125)"
              />
              <div
                className="networks-tab__networks-list-name networks-tab__networks-list-name--selected"
              >
                { this.context.t('newNetwork') }
              </div>
              <div className="networks-tab__networks-list-arrow" />
            </div>
          )
        }
      </div>
    )
  }

  renderNetworksTabContent () {
    const { t } = this.context
    const {
      setRpcTarget,
      showConfirmDeleteNetworkModal,
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
      providerUrl,
      networksToRender,
      history,
      isFullScreen,
      shouldRenderNetworkForm,
    } = this.props

    return (
      <>
        { this.renderNetworksList() }
        {
          shouldRenderNetworkForm
            ? (
              <NetworkForm
                rpcUrls={networksToRender.map((network) => network.rpcUrl)}
                setRpcTarget={setRpcTarget}
                editRpc={editRpc}
                networkName={label || (labelKey && t(labelKey)) || ''}
                rpcUrl={rpcUrl}
                chainId={chainId}
                ticker={ticker}
                onClear={(shouldUpdateHistory = true) => {
                  setNetworksTabAddMode(false)
                  setSelectedSettingsRpcUrl('')
                  if (shouldUpdateHistory && !isFullScreen) {
                    history.push(NETWORKS_ROUTE)
                  }
                }}
                showConfirmDeleteNetworkModal={showConfirmDeleteNetworkModal}
                viewOnly={viewOnly}
                isCurrentRpcTarget={providerUrl === rpcUrl}
                networksTabIsInAddMode={networksTabIsInAddMode}
                rpcPrefs={rpcPrefs}
                blockExplorerUrl={blockExplorerUrl}
                isFullScreen={isFullScreen}
              />
            )
            : null
        }
      </>
    )
  }

  render () {
    const {
      setNetworksTabAddMode,
      setSelectedSettingsRpcUrl,
      history,
      isFullScreen,
      shouldRenderNetworkForm,
    } = this.props

    return (
      <div className="networks-tab__body">
        {isFullScreen && this.renderSubHeader()}
        <div className="networks-tab__content">
          {this.renderNetworksTabContent()}
          {!isFullScreen && !shouldRenderNetworkForm
            ? (
              <div className="networks-tab__networks-list-popup-footer">
                <Button
                  type="primary"
                  onClick={(event) => {
                    event.preventDefault()
                    setSelectedSettingsRpcUrl('')
                    setNetworksTabAddMode(true)
                    history.push(NETWORKS_FORM_ROUTE)
                  }}
                >
                  { this.context.t('addNetwork') }
                </Button>
              </div>
            )
            : null
          }
        </div>
      </div>
    )
  }
}
