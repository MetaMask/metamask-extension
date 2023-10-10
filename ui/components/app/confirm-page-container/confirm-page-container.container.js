import { connect } from 'react-redux';
import { getAccountsWithLabels, getAddressBookEntry } from '../../../selectors';
import * as actions from '../../../store/actions';
import ConfirmPageContainer from './confirm-page-container.component';

function mapStateToProps(state, ownProps) {
  const to = ownProps.toAddress;

  const contact = getAddressBookEntry(state, to);
  return {
    contact,
    toName: contact?.name || ownProps.toName,
    isOwnedAccount: getAccountsWithLabels(state)
      .map((accountWithLabel) => accountWithLabel.address)
      .includes(to),
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
    addNicknameModal: (address) =>
      dispatch(
        actions.showModal({
          name: 'ADD_UPDATE_NICKNAME_MODAL',
          address,
        }),
      ),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { to, ...restStateProps } = stateProps;
  return {
    ...ownProps,
    ...restStateProps,
    addNicknameModal: () => dispatchProps.addNicknameModal(to),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(ConfirmPageContainer);
