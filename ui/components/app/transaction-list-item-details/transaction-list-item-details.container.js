import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { tryReverseResolveAddress } from '../../../store/actions';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
///: END:ONLY_INCLUDE_IF
import {
  getAddressBook,
  getBlockExplorerLinkText,
  getIsCustomNetwork,
  getRpcPrefsForCurrentProvider,
  getEnsResolutionByAddress,
  getAccountName,
  getMetadataContractName,
  getInternalAccounts,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getKnownMethodData,
  getSelectedInternalAccount,
  ///: END:ONLY_INCLUDE_IF
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

  const isCustomNetwork = getIsCustomNetwork(state);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const data = ownProps.transactionGroup?.primaryTransaction?.txParams?.data;
  const methodData = getKnownMethodData(state, data) || {};
  const transactionNote =
    ownProps.transactionGroup?.primaryTransaction?.metadata?.note;
  ///: END:ONLY_INCLUDE_IF

  return {
    rpcPrefs,
    recipientEns,
    senderNickname: getNickName(senderAddress),
    recipientNickname: recipientAddress ? getNickName(recipientAddress) : null,
    isCustomNetwork,
    blockExplorerLinkText: getBlockExplorerLinkText(state),
    recipientName,
    recipientMetadataName,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    methodData,
    transactionNote,
    selectedAccount: getSelectedInternalAccount(state),
    ///: END:ONLY_INCLUDE_IF
  };
};

const mapDispatchToProps = (dispatch) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiActions = mmiActionsFactory();
  ///: END:ONLY_INCLUDE_IF
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address));
    },
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    getCustodianTransactionDeepLink: (address, txId) => {
      return dispatch(
        mmiActions.getCustodianTransactionDeepLink(address, txId),
      );
    },
    ///: END:ONLY_INCLUDE_IF
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(TransactionListItemDetails);
