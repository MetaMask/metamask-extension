import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { removeNetwork } from '../../../../store/actions';
import {
  getNetworkConfigurationsByChainId,
  getProviderConfig,
} from '../../../../../shared/modules/selectors/networks';
import { enableSingleNetwork } from '../../../../store/controller-actions/network-order-controller';
import { getIsMultichainAccountsState2Enabled } from '../../../../selectors';
import ConfirmDeleteNetwork from './confirm-delete-network.component';

const mapStateToProps = (state, ownProps) => {
  const networks = getNetworkConfigurationsByChainId(state);
  const isMultichainAccountsFeatureEnabled =
    getIsMultichainAccountsState2Enabled(state);

  let selectedEvmChainId;
  try {
    selectedEvmChainId = getProviderConfig(state).chainId;
  } catch {
    // Do nothing
  }
  const { chainId, name: networkNickname } = networks[ownProps.target];
  const isChainToDeleteSelected = chainId === selectedEvmChainId;
  return {
    chainId,
    networkNickname,
    isChainToDeleteSelected,
    isMultichainAccountsFeatureEnabled,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    switchToEthereumNetwork: async (isMultichainAccountsFeatureEnabled) => {
      await dispatch(
        enableSingleNetwork('0x1', Boolean(isMultichainAccountsFeatureEnabled)),
      );
    },
    removeNetwork: (chainId) => {
      dispatch(removeNetwork(chainId));
    },
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmDeleteNetwork);
