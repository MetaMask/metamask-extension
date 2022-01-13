import { connect } from 'react-redux';
import { NETWORK_TYPE_RPC } from '../../../../shared/constants/network';
import * as actions from '../../../store/actions';
import { getNetworkIdentifier, isNetworkLoading } from '../../../selectors';
import LoadingNetworkScreen from './loading-network-screen.component';

const mapStateToProps = (state) => {
  const { loadingMessage } = state.appState;
  const { provider } = state.metamask;
  const { rpcUrl, chainId, ticker, nickname, type } = provider;

  const setProviderArgs =
    type === NETWORK_TYPE_RPC
      ? [rpcUrl, chainId, ticker, nickname]
      : [provider.type];

  return {
    isNetworkLoading: isNetworkLoading(state),
    loadingMessage,
    setProviderArgs,
    provider,
    providerId: getNetworkIdentifier(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type));
    },
    rollbackToPreviousProvider: () =>
      dispatch(actions.rollbackToPreviousProvider()),
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(LoadingNetworkScreen);
