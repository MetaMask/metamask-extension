import { connect } from 'react-redux';
import { getAccountsWithLabels, getAddressBookEntry } from '../../../selectors';
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

export default connect(mapStateToProps)(ConfirmPageContainer);
