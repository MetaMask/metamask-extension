import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { removeNetworkConfiguration } from '../../../../store/actions';
import { getNetworkConfigurations } from '../../../../selectors';
import ConfirmDeleteNetwork from './confirm-delete-network.component';

const mapStateToProps = (state, ownProps) => {
  const networkConfigurations = getNetworkConfigurations(state);
  const networkNickname = networkConfigurations[ownProps.target].nickname;

  return { networkNickname };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeNetworkConfiguration: (target) =>
      dispatch(removeNetworkConfiguration(target)),
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmDeleteNetwork);
