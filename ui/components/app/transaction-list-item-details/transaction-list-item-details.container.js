import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  tryReverseResolveAddress,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getMMIActions,
  ///: END:ONLY_INCLUDE_IN
} from '../../../store/actions';
import {
  getAddressBook,
  getBlockExplorerLinkText,
  getIsCustomNetwork,
  getRpcPrefsForCurrentProvider,
  getEnsResolutionByAddress,
  getAccountName,
  getMetadataContractName,
  getMetaMaskIdentities,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getSelectedIdentity,
  getKnownMethodData,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
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
  const identities = getMetaMaskIdentities(state);
  const recipientName = getAccountName(identities, recipientAddress);
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

  const isCustomNetwork = getIsCustomNetwork(state);

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const data = ownProps.transactionGroup?.primaryTransaction?.txParams?.data;
  const methodData = getKnownMethodData(state, data) || {};
  const transactionNote =
    ownProps.transactionGroup?.primaryTransaction?.metadata?.note;
  ///: END:ONLY_INCLUDE_IN

  return {
    rpcPrefs,
    recipientEns,
    senderNickname: getNickName(senderAddress),
    recipientNickname: recipientAddress ? getNickName(recipientAddress) : null,
    isCustomNetwork,
    blockExplorerLinkText: getBlockExplorerLinkText(state),
    recipientName,
    recipientMetadataName,
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    methodData,
    transactionNote,
    selectedIdentity: getSelectedIdentity(state),
    ///: END:ONLY_INCLUDE_IN
  };
};

const mapDispatchToProps = (dispatch) => {
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const MMIActions = getMMIActions();
  ///: END:ONLY_INCLUDE_IN
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address));
    },
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    getCustodianTransactionDeepLink: (address, txId) => {
      return dispatch(
        MMIActions.getCustodianTransactionDeepLink(address, txId),
      );
    },
    ///: END:ONLY_INCLUDE_IN
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(TransactionListItemDetails);
