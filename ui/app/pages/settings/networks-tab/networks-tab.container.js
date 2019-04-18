import NetworksTab from './networks-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  setSelectedSettingsRpcUrl,
  updateAndSetCustomRpc,
  displayWarning,
  setNetworksTabAddMode,
} from '../../../store/actions'
import { defaultNetworksData } from './networks-tab.constants'
const defaultNetworks = defaultNetworksData.map(network => ({ ...network, viewOnly: true }))

const mapStateToProps = state => {
  const {
    frequentRpcListDetail,
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
    }
  })

  const networksToRender = [ ...defaultNetworks, ...frequentRpcNetworkListDetails ]
  const selectedNetwork = networksToRender.find(network => network.rpcUrl === networksTabSelectedRpcUrl) || {}
  const networkIsSelected = Boolean(selectedNetwork.rpcUrl)

  let subHeaderKey
  if (networksTabIsInAddMode) {
    subHeaderKey = 'addNetwork'
  else if (selectedNetwork.viewOnly) {
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
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setSelectedSettingsRpcUrl: newRpcUrl => dispatch(setSelectedSettingsRpcUrl(newRpcUrl)),
    setRpcTarget: (newRpc, chainId, ticker, nickname) => dispatch(updateAndSetCustomRpc(newRpc, chainId, ticker, nickname)),
    displayWarning: warning => dispatch(displayWarning(warning)),
    setNetworksTabAddMode: isInAddMode => dispatch(setNetworksTabAddMode(isInAddMode))
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NetworksTab)
