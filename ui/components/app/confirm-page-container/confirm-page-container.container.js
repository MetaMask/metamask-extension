import { connect } from 'react-redux';
import { getAddressBookEntry } from '../../../selectors';
import * as actions from '../../../store/actions';
import ConfirmPageContainer from './confirm-page-container.component';

function mapStateToProps(state, ownProps) {
  const to = ownProps.toAddress;

  const contact = getAddressBookEntry(state, to);
  return {
    contact,
    toName: contact?.name || ownProps.name,
    to,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showAddToAddressBookModal: (recipient) =>
      dispatch(
        actions.showModal({
          name: 'ADD_TO_ADDRESSBOOK',
          recipient,
        }),
      ),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { to, ...restStateProps } = stateProps;
  return {
    ...ownProps,
    ...restStateProps,
    showAddToAddressBookModal: () =>
      dispatchProps.showAddToAddressBookModal(to),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(ConfirmPageContainer);
