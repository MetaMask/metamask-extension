import { connect } from 'react-redux';
import { getAccountsWithLabels, getAddressBookEntry } from '../../../selectors';
import * as actions from '../../../store/actions';
import { domainOutsideWhitelist } from '../../../helpers/utils/util';
import ConfirmPageContainer from './confirm-page-container.component';

function mapStateToProps(state, ownProps) {
  const to = ownProps.toAddress;
  const requestMetadata = ownProps?.origin ? new URL(ownProps?.origin) : null;
  const { useWhitelistMode, whitelistValues } = state.metamask;
  const isNonWhitelistedDomain = domainOutsideWhitelist(
    requestMetadata?.host,
    useWhitelistMode,
    whitelistValues,
  );
  const contact = getAddressBookEntry(state, to);
  return {
    contact,
    isNonWhitelistedDomain,
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
