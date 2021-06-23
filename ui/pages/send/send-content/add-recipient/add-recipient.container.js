import { connect } from 'react-redux';
import {
  accountsWithSendEtherInfoSelector,
  getAddressBook,
  getAddressBookEntry,
} from '../../../../selectors';

import {
  updateRecipient,
  updateRecipientUserInput,
  useMyAccountsForRecipientSearch,
  useContactListForRecipientSearch,
  getIsUsingMyAccountForRecipientSearch,
  getRecipientUserInput,
  getRecipient,
} from '../../../../ducks/send';
import {
  getEnsResolution,
  getEnsError,
  getEnsWarning,
} from '../../../../ducks/ens';
import AddRecipient from './add-recipient.component';

export default connect(mapStateToProps, mapDispatchToProps)(AddRecipient);

function mapStateToProps(state) {
  const ensResolution = getEnsResolution(state);

  let addressBookEntryName = '';
  if (ensResolution) {
    const addressBookEntry = getAddressBookEntry(state, ensResolution) || {};
    addressBookEntryName = addressBookEntry.name;
  }

  const addressBook = getAddressBook(state);

  const ownedAccounts = accountsWithSendEtherInfoSelector(state).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    addressBook,
    addressBookEntryName,
    contacts: addressBook.filter(({ name }) => Boolean(name)),
    ensResolution,
    ensError: getEnsError(state),
    ensWarning: getEnsWarning(state),
    nonContacts: addressBook.filter(({ name }) => !name),
    ownedAccounts,
    isUsingMyAccountsForRecipientSearch: getIsUsingMyAccountForRecipientSearch(
      state,
    ),
    userInput: getRecipientUserInput(state),
    recipient: getRecipient(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
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
