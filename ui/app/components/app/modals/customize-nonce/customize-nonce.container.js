import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import CustomizeNonce from './customize-nonce.component';

const mapStateToProps = (state) => {
  const modalStateProps = state.appState.modal.modalState.props || {};
  return modalStateProps;
};

export default compose(
  withModalProps,
  connect(mapStateToProps),
)(CustomizeNonce);
