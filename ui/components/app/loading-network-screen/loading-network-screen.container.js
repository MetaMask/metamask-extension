import { connect } from 'react-redux';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import * as actions from '../../../store/actions';
import {
  getAllEnabledNetworks,
  getNetworkIdentifier,
  isGlobalNetworkSelectorRemoved,
} from '../../../selectors';
import {
  getProviderConfig,
  isNetworkLoading,
} from '../../../../shared/modules/selectors/networks';
import LoadingNetworkScreen from './loading-network-screen.component';

const DEPRECATED_TEST_NET_CHAINIDS = ['0x3', '0x2a', '0x4'];

const mapStateToProps = (state) => {
  const { loadingMessage } = state.appState;
  const providerConfig = getProviderConfig(state);
  const { rpcUrl, chainId, ticker, nickname, type } = providerConfig;

  const setProviderArgs =
    type === NETWORK_TYPES.RPC ? [rpcUrl, chainId, ticker, nickname] : [type];

  const providerChainId = chainId;
  const isDeprecatedNetwork =
    DEPRECATED_TEST_NET_CHAINIDS.includes(providerChainId);
  const isInfuraRpcUrl = rpcUrl && new URL(rpcUrl).host.endsWith('.infura.io');
  const showDeprecatedRpcUrlWarning = isDeprecatedNetwork && isInfuraRpcUrl;

  // Ensure we have a nickname to provide the user
  // in case of connection error
  let networkName = nickname;
  if (networkName === undefined) {
    const networks = getAllEnabledNetworks(state);
    const desiredNetwork = networks[chainId];
    if (desiredNetwork) {
      networkName = desiredNetwork.name;
    }
  }

  return {
    isNetworkLoading: isNetworkLoading(state),
    loadingMessage,
    setProviderArgs,
    providerConfig: {
      ...providerConfig,
      nickname: networkName,
    },
    providerId: getNetworkIdentifier(state),
    showDeprecatedRpcUrlWarning,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setActiveNetwork: (type) => {
      dispatch(actions.setActiveNetwork(type));
    },
    rollbackToPreviousProvider: () =>
      dispatch(actions.rollbackToPreviousProvider()),
    showNetworkDropdown: () => {
      if (isGlobalNetworkSelectorRemoved) {
        return dispatch(actions.showModal({ name: 'NETWORK_MANAGER' }));
      }
      return dispatch(actions.toggleNetworkMenu());
    },
    showNetworkManager: () => {
      dispatch(actions.showModal({ name: 'NETWORK_MANAGER' }));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LoadingNetworkScreen);
