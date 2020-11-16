import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
import { getNetworkIdentifier } from '../../../selectors'
import LoadingNetworkScreen from './loading-network-screen.component'

const mapStateToProps = (state) => {
  const { loadingMessage, lastSelectedProvider } = state.appState
  const { provider, network } = state.metamask
  const { rpcUrl, chainId, ticker, nickname, type } = provider

  const setProviderArgs =
    type === 'rpc' ? [rpcUrl, chainId, ticker, nickname] : [provider.type]

  return {
    isLoadingNetwork: network === 'loading',
    loadingMessage,
    lastSelectedProvider,
    setProviderArgs,
    provider,
    providerId: getNetworkIdentifier(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type))
    },
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LoadingNetworkScreen)
