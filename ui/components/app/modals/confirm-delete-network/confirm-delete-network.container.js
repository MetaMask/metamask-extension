import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { removeNetwork } from '../../../../store/actions';
import { getNetworkConfigurations } from '../../../../selectors';
import ConfirmDeleteNetwork from './confirm-delete-network.component';

const mapStateToProps = (state, ownProps) => {
  const networkConfigurations = getNetworkConfigurations(state);
  const { networkNickname, chainId } = networkConfigurations[ownProps.target];

  return { networkNickname, chainId };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeNetwork: (target) => {
      dispatch(removeNetwork(target));
    },
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmDeleteNetwork);
