import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { clearContactList } from '../../../../store/actions';
import ConfirmClearContactListComponent from './confirm-clear-contact-list.component';

const mapDispatchToProps = () => {
  return {
    clearContactList: () => clearContactList(),
  };
};

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps),
)(ConfirmClearContactListComponent);
