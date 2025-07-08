import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import {
  getAccountName,
  getAddressBook,
  getBlockExplorerLinkText,
  getInternalAccounts,
  getIsCustomNetwork,
  getRpcPrefsForCurrentProvider,
  getSelectedAddress,
  getSelectedInternalAccount,
} from '../../../selectors';
import { tryReverseResolveAddress } from '../../../store/actions';
import TransactionListItemDetails from './transaction-list-item-details.component';

const mapStateToProps = (state, ownProps) => {
  const { recipientAddress, senderAddress } = ownProps;
  const addressBook = getAddressBook(state);
  const accounts = getInternalAccounts(state);
  const recipientName = getAccountName(accounts, recipientAddress);
  const selectedAccount = getSelectedInternalAccount(state);
  const selectedAddress = getSelectedAddress(state);

  const getNickName = (address) => {
    const entry = addressBook.find((contact) => {
      return address.toLowerCase() === contact.address.toLowerCase();
    });
    return (entry && entry.name) || '';
  };
  const rpcPrefs = getRpcPrefsForCurrentProvider(state);

  const networkConfiguration = getNetworkConfigurationsByChainId(state);
  const isCustomNetwork = getIsCustomNetwork(state);

  return {
    rpcPrefs,
    networkConfiguration,
    senderNickname: getNickName(senderAddress),
    isCustomNetwork,
    blockExplorerLinkText: getBlockExplorerLinkText(state),
    recipientName,
    selectedAccount,
    selectedAddress,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(TransactionListItemDetails);
