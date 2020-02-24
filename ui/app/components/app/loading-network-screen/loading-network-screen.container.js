import { connect } from 'react-redux'
import LoadingNetworkScreen from './loading-network-screen.component'
import * as actions from '../../../store/actions'
import { getNetworkIdentifier } from '../../../selectors/selectors'

const mapStateToProps = (state) => {
  const {
    loadingMessage,
  } = state.appState
  const {
    provider,
    lastSelectedProvider,
    network,
  } = state.metamask
  const { rpcTarget, chainId, ticker, nickname, type } = provider

  const setProviderArgs = type === 'rpc'
    ? [rpcTarget, chainId, ticker, nickname]
    : [provider.type]

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

export default connect(mapStateToProps, mapDispatchToProps)(LoadingNetworkScreen)
