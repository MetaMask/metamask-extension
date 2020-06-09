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
  showModal,
  getNetworkInfo,
} from '../../../store/actions'
import { defaultNetworksData } from './networks-tab.constants'

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}))

const mapStateToProps = (state) => {
  const { frequentRpcListDetail, provider } = state.metamask
  const { networkInfo, networksTabSelectedRpcUrl, networksTabIsInAddMode } = state.appState

  const frequentRpcNetworkListDetails = frequentRpcListDetail.map((rpc) => {
    return {
      label: rpc.nickname,
      iconColor: '#6A737D',
      providerType: 'rpc',
      rpcUrl: rpc.rpcUrl,
      chainId: rpc.chainId,
      ticker: rpc.ticker,
      blockExplorerUrl: (rpc.rpcPrefs && rpc.rpcPrefs.blockExplorerUrl) || '',
    }
  })

  const networksToRender = [
    ...defaultNetworks,
    ...frequentRpcNetworkListDetails,
  ]
  networksToRender.forEach((network, i) => {
    if (networkInfo[i]) {
      network.chainId = parseInt(networkInfo[i].chainId, 16).toString(10)
    } else {
      network.chainId = '0'
    }
  })
  let selectedNetwork =
    networksToRender.find(
      (network) => network.rpcUrl === networksTabSelectedRpcUrl
    ) || {}
  const networkIsSelected = Boolean(selectedNetwork.rpcUrl)

  let networkDefaultedToProvider = false
  if (!networkIsSelected && !networksTabIsInAddMode) {
    selectedNetwork =
      networksToRender.find((network) => {
        return (
          network.rpcUrl === provider.rpcTarget ||
          (network.providerType !== 'rpc' &&
            network.providerType === provider.type)
        )
      }) || {}
    networkDefaultedToProvider = true
  }

  return {
    selectedNetwork,
    networksToRender,
    networkIsSelected,
    networksTabIsInAddMode,
    providerType: provider.type,
    providerUrl: provider.rpcTarget,
    networkDefaultedToProvider,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    getNetworkInfo: (networksToRender) => () => dispatch(getNetworkInfo(networksToRender.map(({ rpcUrl }) => rpcUrl))),
    setSelectedSettingsRpcUrl: (newRpcUrl) =>
      dispatch(setSelectedSettingsRpcUrl(newRpcUrl)),
    setRpcTarget: (newRpc, chainId, ticker, nickname, rpcPrefs) => {
      dispatch(
        updateAndSetCustomRpc(newRpc, chainId, ticker, nickname, rpcPrefs)
      )
    },
    showConfirmDeleteNetworkModal: ({ target, onConfirm }) => {
      return dispatch(
        showModal({ name: 'CONFIRM_DELETE_NETWORK', target, onConfirm })
      )
    },
    displayWarning: (warning) => dispatch(displayWarning(warning)),
    setNetworksTabAddMode: (isInAddMode) =>
      dispatch(setNetworksTabAddMode(isInAddMode)),
    editRpc: (oldRpc, newRpc, chainId, ticker, nickname, rpcPrefs) => {
      dispatch(editRpc(oldRpc, newRpc, chainId, ticker, nickname, rpcPrefs))
    },
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { networksToRender } = stateProps
  const { getNetworkInfo } = dispatchProps

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    getNetworkInfo: getNetworkInfo(networksToRender),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(NetworksTab)
