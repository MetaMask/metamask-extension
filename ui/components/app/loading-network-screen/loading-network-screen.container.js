import { connect } from 'react-redux';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import * as actions from '../../../store/actions';
import {
  getAllEnabledNetworks,
  getNetworkIdentifier,
} from '../../../selectors';
import {
  getProviderConfig,
  isNetworkLoading,
} from '../../../../shared/modules/selectors/networks';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
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
      return dispatch(actions.toggleNetworkMenu());
    },
    showNetworkManager: () => {
      dispatch(actions.showModal({ name: 'NETWORK_MANAGER' }));
    },
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { history, location, ...restOwnProps } = ownProps;

  const onDisplayed = () => {
    // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
    let redirectTo = DEFAULT_ROUTE;
    if (location.state?.from?.pathname) {
      const search = location.state.from.search || '';
      redirectTo = location.state.from.pathname + search;
    }
    history.push(redirectTo);
  };

  return {
    ...stateProps,
    ...dispatchProps,
    ...restOwnProps,
    onDisplayed,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(LoadingNetworkScreen);
