import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { removeNetwork } from '../../../../store/actions';
import { getNetworkConfigurationsByChainId } from '../../../../selectors';
import ConfirmDeleteNetwork from './confirm-delete-network.component';

const mapStateToProps = (state, ownProps) => {
  const networks = getNetworkConfigurationsByChainId(state);
  const { chainId, name: networkNickname } = networks[ownProps.target];
  return { chainId, networkNickname };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeNetwork: (chainId) => {
      dispatch(removeNetwork(chainId));
    },
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmDeleteNetwork);
