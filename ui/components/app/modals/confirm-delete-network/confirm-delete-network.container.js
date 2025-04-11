import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import {
  removeNetwork,
  setActiveNetworkConfigurationId,
} from '../../../../store/actions';
import {
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
} from '../../../../../shared/modules/selectors/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import ConfirmDeleteNetwork from './confirm-delete-network.component';

const mapStateToProps = (state, ownProps) => {
  const networks = getNetworkConfigurationsByChainId(state);
  const currentChainId = getCurrentChainId(state);
  const { rpcEndpoints, defaultRpcEndpointIndex } = networks[CHAIN_IDS.MAINNET];
  const ethereumMainnetClientId =
    rpcEndpoints[defaultRpcEndpointIndex].networkClientId;
  const { chainId, name: networkNickname } = networks[ownProps.target];
  return { ethereumMainnetClientId, currentChainId, chainId, networkNickname };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeNetwork: (chainId) => {
      dispatch(removeNetwork(chainId));
    },
    switchEvmNetwork: (networkClientId) => {
      dispatch(setActiveNetworkConfigurationId(networkClientId));
    },
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmDeleteNetwork);
