import { connect } from 'react-redux';
import {
  getAddressBookEntry,
  getSwapsDefaultToken,
  getMetadataContractName,
  getAccountName,
  getInternalAccounts,
} from '../../../../selectors';
import ConfirmPageContainer from './confirm-page-container.component';

function mapStateToProps(state, ownProps) {
  const to = ownProps.toAddress;
  const contact = getAddressBookEntry(state, to);
  const defaultToken = getSwapsDefaultToken(state);
  const accountBalance = defaultToken.string;
  const internalAccounts = getInternalAccounts(state);
  const ownedAccountName = getAccountName(internalAccounts, to);
  const toName = ownedAccountName || contact?.name;
  const toMetadataName = getMetadataContractName(state, to);

  return {
    contact,
    toName,
    toMetadataName,
    recipientIsOwnedAccount: Boolean(ownedAccountName),
    to,
    accountBalance,
  };
}

export default connect(mapStateToProps)(ConfirmPageContainer);
