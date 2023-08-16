import { connect } from 'react-redux';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import * as actions from '../../../store/actions';
import {
  getAllEnabledNetworks,
  getNetworkIdentifier,
  isNetworkLoading,
} from '../../../selectors';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
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
    const desiredNetwork = networks.find(
      (network) => network.chainId === chainId,
    );
    if (desiredNetwork) {
      networkName = desiredNetwork.nickname;
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
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type));
    },
    rollbackToPreviousProvider: () =>
      dispatch(actions.rollbackToPreviousProvider()),
    showNetworkDropdown: () => {
      return dispatch(actions.toggleNetworkMenu());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LoadingNetworkScreen);
