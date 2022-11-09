import { connect } from 'react-redux';
import {
  getAccountsWithLabels,
  getAddressBookEntry,
  getIsBuyableChain,
  getNetworkIdentifier,
  getSwapsDefaultToken,
  getMetadataContractName,
  getAccountName,
} from '../../../selectors';
import ConfirmPageContainer from './confirm-page-container.component';

function mapStateToProps(state, ownProps) {
  const to = ownProps.toAddress;
  const isBuyableChain = getIsBuyableChain(state);
  const contact = getAddressBookEntry(state, to);
  const networkIdentifier = getNetworkIdentifier(state);
  const defaultToken = getSwapsDefaultToken(state);
  const accountBalance = defaultToken.string;
  const toName = getAccountName(state, to);
  const toMetadataName = getMetadataContractName(to);

  return {
    isBuyableChain,
    contact,
    toName,
    toMetadataName,
    isOwnedAccount: getAccountsWithLabels(state)
      .map((accountWithLabel) => accountWithLabel.address)
      .includes(to),
    to,
    networkIdentifier,
    accountBalance,
  };
}

export default connect(mapStateToProps)(ConfirmPageContainer);
