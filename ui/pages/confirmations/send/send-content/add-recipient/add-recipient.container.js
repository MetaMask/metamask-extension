import { connect } from 'react-redux';
import {
  getAddressBook,
  getInternalAccountsSortedByKeyring,
  getCurrentNetworkTransactions,
} from '../../../../../selectors';

import {
  updateRecipient,
  updateRecipientUserInput,
  useMyAccountsForRecipientSearch,
  useContactListForRecipientSearch,
  getRecipientUserInput,
  getRecipient,
  addHistoryEntry,
} from '../../../../../ducks/send';
import {
  getDomainResolutions,
  getDomainError,
  getDomainWarning,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  getDomainType,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../../ducks/domains';
import AddRecipient from './add-recipient.component';

export default connect(mapStateToProps, mapDispatchToProps)(AddRecipient);

function mapStateToProps(state) {
  const domainResolutions = getDomainResolutions(state);
  let domainResolution, resolvingSnap, addressBookEntryName;
  if (domainResolutions?.length > 0) {
    domainResolution = domainResolutions[0].resolvedAddress;
    resolvingSnap = domainResolutions[0].resolvingSnap;
    addressBookEntryName = domainResolutions[0].addressBookEntryName;
  }
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const domainType = getDomainType(state);
  ///: END:ONLY_INCLUDE_IF

  const addressBook = getAddressBook(state);

  const txList = [...getCurrentNetworkTransactions(state)].reverse();

  const nonContacts = addressBook
    .filter(({ name }) => !name)
    .map((nonContact) => {
      const nonContactTx = txList.find(
        (transaction) =>
          transaction.txParams.to === nonContact.address.toLowerCase(),
      );
      return { ...nonContact, timestamp: nonContactTx?.time };
    });

  nonContacts.sort((a, b) => {
    return b.timestamp - a.timestamp;
  });

  const ownedAccounts = getInternalAccountsSortedByKeyring(state).map(
    ({ address, metadata }) => {
      return {
        address,
        name: metadata.name,
      };
    },
  );

  return {
    addressBook,
    addressBookEntryName,
    contacts: addressBook.filter(({ name }) => Boolean(name)),
    domainResolution,
    domainError: getDomainError(state),
    domainWarning: getDomainWarning(state),
    nonContacts,
    ownedAccounts,
    userInput: getRecipientUserInput(state),
    recipient: getRecipient(state),
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    domainType,
    resolvingSnap,
    ///: END:ONLY_INCLUDE_IF
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addHistoryEntry: (entry) => dispatch(addHistoryEntry(entry)),
    updateRecipient: ({ address, nickname }) =>
      dispatch(updateRecipient({ address, nickname })),
    updateRecipientUserInput: (newInput) =>
      dispatch(updateRecipientUserInput(newInput)),
    useMyAccountsForRecipientSearch: () =>
      dispatch(useMyAccountsForRecipientSearch()),
    useContactListForRecipientSearch: () =>
      dispatch(useContactListForRecipientSearch()),
  };
}
