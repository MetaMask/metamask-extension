import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { tryReverseResolveAddress } from '../../../store/actions';

import {
  getAddressBook,
  getBlockExplorerLinkText,
  getIsCustomNetwork,
  getRpcPrefsForCurrentProvider,
  getEnsResolutionByAddress,
  getAccountName,
  getMetadataContractName,
  getInternalAccounts,
} from '../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import TransactionListItemDetails from './transaction-list-item-details.component';

const mapStateToProps = (state, ownProps) => {
  const { recipientAddress, senderAddress } = ownProps;
  let recipientEns;
  if (recipientAddress) {
    const address = toChecksumHexAddress(recipientAddress);
    recipientEns = getEnsResolutionByAddress(state, address);
  }
  const addressBook = getAddressBook(state);
  const accounts = getInternalAccounts(state);
  const recipientName = getAccountName(accounts, recipientAddress);
  const recipientMetadataName = getMetadataContractName(
    state,
    recipientAddress,
  );

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
    recipientEns,
    senderNickname: getNickName(senderAddress),
    recipientNickname: recipientAddress ? getNickName(recipientAddress) : null,
    isCustomNetwork,
    blockExplorerLinkText: getBlockExplorerLinkText(state),
    recipientName,
    recipientMetadataName,
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
