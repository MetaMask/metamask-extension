import { connect } from 'react-redux';
import {
  getAddressBookEntry,
  getIsBuyableChain,
  getNetworkIdentifier,
  getSwapsDefaultToken,
  getMetadataContractName,
  getAccountName,
  getMetaMaskIdentities,
  getAccountsWithLabels,
} from '../../../selectors';
import ConfirmPageContainer from './confirm-page-container.component';

function mapStateToProps(state, ownProps) {
  const to = ownProps.toAddress;
  const isBuyableChain = getIsBuyableChain(state);
  const contact = getAddressBookEntry(state, to);
  const networkIdentifier = getNetworkIdentifier(state);
  const defaultToken = getSwapsDefaultToken(state);
  const accountBalance = defaultToken.string;
  const identities = getMetaMaskIdentities(state);
  const toName = getAccountName(identities, to);
  const toMetadataName = getMetadataContractName(state, to);

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
