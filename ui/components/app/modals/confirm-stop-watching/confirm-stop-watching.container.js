import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { stopWatching } from '../../../../store/actions';
import ConfirmStopWatching from './confirm-stop-watching.component';

const mapDispatchToProps = (dispatch) => {
  return {
    stopWatching: () => dispatch(stopWatching()),
  };
};

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps),
)(ConfirmStopWatching);
