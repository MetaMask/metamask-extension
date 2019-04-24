import NetworksTab from './networks-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  setSelectedSettingsRpcUrl,
  updateAndSetCustomRpc,
  displayWarning,
  setNetworksTabAddMode,
  editRpc,
} from '../../../store/actions'
import { defaultNetworksData } from './networks-tab.constants'
const defaultNetworks = defaultNetworksData.map(network => ({ ...network, viewOnly: true }))

const mapStateToProps = state => {
  const {
    frequentRpcListDetail,
    provider,
  } = state.metamask
  const {
    networksTabSelectedRpcUrl,
    networksTabIsInAddMode,
  } = state.appState

  const frequentRpcNetworkListDetails = frequentRpcListDetail.map(rpc => {
    return {
      label: rpc.nickname,
      iconColor: '#6A737D',
      providerType: 'rpc',
      rpcUrl: rpc.rpcUrl,
      chainId: rpc.chainId,
      ticker: rpc.ticker,
      blockExplorerUrl: rpc.rpcPrefs && rpc.rpcPrefs.blockExplorerUrl || '',
    }
  })

  const networksToRender = [ ...defaultNetworks, ...frequentRpcNetworkListDetails ]
  let selectedNetwork = networksToRender.find(network => network.rpcUrl === networksTabSelectedRpcUrl) || {}
  let networkIsSelected = Boolean(selectedNetwork.rpcUrl)

  let networkDefaultedToProvider = false
  if (!networkIsSelected && !networksTabIsInAddMode) {
    selectedNetwork = networksToRender.find(network => {
      return network.rpcUrl === provider.rpcTarget || network.providerType !== 'rpc' && network.providerType === provider.type
    }) || {}
    networkIsSelected = Boolean(selectedNetwork.rpcUrl)
    networkDefaultedToProvider = true
  }

  let subHeaderKey
  if (networksTabIsInAddMode) {
    subHeaderKey = 'addNetwork'
  } else if (selectedNetwork.viewOnly) {
    subHeaderKey = 'viewNetworkInfo'
  } else if (networkIsSelected) {
    subHeaderKey = 'editNetwork'
  } else {
    subHeaderKey = 'networks'
  }

  return {
    selectedNetwork,
    networksToRender,
    networkIsSelected,
    subHeaderKey,
    networksTabIsInAddMode,
    providerType: provider.type,
    providerUrl: provider.rpcTarget,
    networkDefaultedToProvider,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setSelectedSettingsRpcUrl: newRpcUrl => dispatch(setSelectedSettingsRpcUrl(newRpcUrl)),
    setRpcTarget: (newRpc, chainId, ticker, nickname, rpcPrefs) => dispatch(updateAndSetCustomRpc(newRpc, chainId, ticker, nickname, rpcPrefs)),
    displayWarning: warning => dispatch(displayWarning(warning)),
    setNetworksTabAddMode: isInAddMode => dispatch(setNetworksTabAddMode(isInAddMode)),
    editRpc: (oldRpc, newRpc, chainId, ticker, nickname, rpcPrefs) => dispatch(editRpc(oldRpc, newRpc, chainId, ticker, nickname, rpcPrefs)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NetworksTab)
